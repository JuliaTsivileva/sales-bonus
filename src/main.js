/**
 * Функция для расчета прибыли
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
// @TODO: Расчет выручки от операции

function calculateSimpleRevenue(purchase, _product) {
    const discount = purchase.discount || 0;
    const sale = purchase.sale || purchase.sale_price || 0;
    const quantity = purchase.quantity || 0;
    
    const discountRate = 1 - (discount / 100);
    const revenue = sale * quantity * discountRate;
    
    // Используем toFixed для правильного округления
    return parseFloat(revenue.toFixed(2));
}

/**
 * Функция для расчета бонусов на основе позиции в рейтинге
 * @param index порядковый номер в отсортированном массиве (0-индексация)
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const profit = seller.profit || 0;
    const position = index + 1;
    
    let bonusPercent = 0;
    
    if (position === 1) {
        bonusPercent = 0.15;
    } else if (position === 2 || position === 3) {
        bonusPercent = 0.10;
    } else if (position === total) {
        bonusPercent = 0;
    } else {
        bonusPercent = 0.05;
    }
    
    const bonus = profit * bonusPercent;
    // Используем toFixed для правильного округления
    return parseFloat(bonus.toFixed(2));
}

/**
 * Функция для анализа данных продаж
 * @param data объект с данными (sellers, products, purchase_records)
 * @param options объект с функциями calculateRevenue и calculateBonus
 * @returns {Array} массив с результатами анализа
 */
function analyzeSalesData(data, options) {
    // Проверка входных данных
    if (!data) {
        throw new Error('Некорректные данные: ожидается объект с данными');
    }
    
    if (!data.sellers || !Array.isArray(data.sellers)) {
        throw new Error('Некорректные данные: sellers должен быть массивом');
    }
    
    if (!data.products || !Array.isArray(data.products)) {
        throw new Error('Некорректные данные: products должен быть массивом');
    }
    
    if (!data.purchase_records || !Array.isArray(data.purchase_records)) {
        throw new Error('Некорректные данные: purchase_records должен быть массивом');
    }
    
    if (data.sellers.length === 0) {
        throw new Error('Некорректные данные: sellers не должен быть пустым');
    }
    
    if (data.products.length === 0) {
        throw new Error('Некорректные данные: products не должен быть пустым');
    }
    
    if (data.purchase_records.length === 0) {
        throw new Error('Некорректные данные: purchase_records не должен быть пустым');
    }
    
    // Проверка опций
    if (!options || typeof options !== 'object') {
        throw new Error('Некорректные опции: ожидается объект');
    }
    
    const calculateRevenue = options.calculateRevenue;
    const calculateBonus = options.calculateBonus;
    
    if (typeof calculateRevenue !== 'function') {
        throw new Error('Некорректные опции: calculateRevenue должен быть функцией');
    }
    
    if (typeof calculateBonus !== 'function') {
        throw new Error('Некорректные опции: calculateBonus должен быть функцией');
    }
    
    // Создание индексов для быстрого доступа
    const sellersMap = {};
    for (let i = 0; i < data.sellers.length; i++) {
        const seller = data.sellers[i];
        sellersMap[seller.id] = seller;
    }
    
    const productsMap = {};
    for (let i = 0; i < data.products.length; i++) {
        const product = data.products[i];
        productsMap[product.sku] = product;
    }
    
    // Подготовка статистики продавцов
    const sellerStats = {};
    for (let i = 0; i < data.sellers.length; i++) {
        const seller = data.sellers[i];
        sellerStats[seller.id] = {
            seller_id: seller.id,
            name: seller.first_name + ' ' + seller.last_name,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            products_sold: {}
        };
    }
    
    // Обработка записей о продажах
    for (let i = 0; i < data.purchase_records.length; i++) {
        const record = data.purchase_records[i];
        const sellerId = record.seller_id;
        
        // Получаем статистику продавца
        const stats = sellerStats[sellerId];
        if (!stats) {
            continue;
        }
        
        // Увеличиваем счетчик продаж (чеков)
        stats.sales_count++;
        
        // Получаем товары из чека
        const items = record.items || [];
        
        // Обрабатываем каждый товар
        for (let j = 0; j < items.length; j++) {
            const item = items[j];
            const productSku = item.sku;
            const product = productsMap[productSku];
            
            if (!product) {
                continue;
            }
            
            const quantity = item.quantity || 0;
            const discount = item.discount || 0;
            const salePrice = item.sale_price || 0;
            
            // Расчет себестоимости
            const costPrice = product.purchase_price || 0;
            const cost = costPrice * quantity;
            
            // Расчет выручки
            const purchaseData = {
                discount: discount,
                sale: salePrice,
                sale_price: salePrice,
                quantity: quantity
            };
            
            let revenue = calculateRevenue(purchaseData, product);
            if (isNaN(revenue)) revenue = 0;
            
            // Расчет прибыли
            const profit = revenue - cost;
            
            // Обновление статистики
            stats.revenue += revenue;
            stats.profit += profit;
            
            // Учет проданных товаров
            if (!stats.products_sold[productSku]) {
                stats.products_sold[productSku] = 0;
            }
            stats.products_sold[productSku] += quantity;
        }
    }
    
    // Преобразуем объект статистики в массив
    const sellersArray = [];
    for (const sellerId in sellerStats) {
        if (sellerStats.hasOwnProperty(sellerId)) {
            sellersArray.push(sellerStats[sellerId]);
        }
    }
    
    // Сортируем по прибыли (от большего к меньшему)
    sellersArray.sort(function(a, b) {
        return b.profit - a.profit;
    });
    
    // Формируем итоговый результат
    const result = [];
    const total = sellersArray.length;
    
    for (let i = 0; i < sellersArray.length; i++) {
        const seller = sellersArray[i];
        
        // Рассчитываем бонус
        let bonus = calculateBonus(i, total, { profit: seller.profit });
        if (isNaN(bonus)) bonus = 0;
        
        // Формируем топ-10 товаров
        const productsList = [];
        for (const sku in seller.products_sold) {
            if (seller.products_sold.hasOwnProperty(sku)) {
                productsList.push({
                    sku: sku,
                    quantity: seller.products_sold[sku]
                });
            }
        }
        
        // Сортируем по количеству (от большего к меньшему)
        productsList.sort(function(a, b) {
            return b.quantity - a.quantity;
        });
        
        // Берем первые 10
        const topProducts = productsList.slice(0, 10);
        
        // Округляем значения до 2 знаков через toFixed
        // Важно: используем toFixed(2) и затем parseFloat
        const roundedRevenue = parseFloat(seller.revenue.toFixed(2));
        const roundedProfit = parseFloat(seller.profit.toFixed(2));
        const roundedBonus = parseFloat(bonus.toFixed(2));
        
        // Добавляем в результат
        result.push({
            seller_id: seller.seller_id,
            name: seller.name,
            revenue: roundedRevenue,
            profit: roundedProfit,
            sales_count: seller.sales_count,
            top_products: topProducts,
            bonus: roundedBonus
        });
    }
    
    return result;
}