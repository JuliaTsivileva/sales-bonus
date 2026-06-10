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
    
    return Number(revenue.toFixed(2));
}

// @TODO: Расчет бонусов от операции
/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const profit = seller.profit || 0;
    const position = index + 1;
    
    if (position === 1) {
        return Number((profit * 0.15).toFixed(2));
    } else if (position === 2 || position === 3) {
        return Number((profit * 0.10).toFixed(2));
    } else if (position === total) {
        return 0;
    } else {
        return Number((profit * 0.05).toFixed(2));
    }
}

/**
 * Функция для анализа данных продаж
 * @param data объект с данными (sellers, products, purchase_records)
 * @param options объект с функциями calculateRevenue и calculateBonus
 * @returns {Object} отчёт с результатами анализа
 */
function analyzeSalesData(data, options) {
    // Проверка входных данных
    if (!data) {
        throw new Error('Некорректные данные: ожидается объект с данными');
    }
    
    if (!data.sellers || !Array.isArray(data.sellers) || data.sellers.length === 0) {
        throw new Error('Некорректные данные: sellers должен быть непустым массивом');
    }
    
    if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
        throw new Error('Некорректные данные: products должен быть непустым массивом');
    }
    
    if (!data.purchase_records || !Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error('Некорректные данные: purchase_records должен быть непустым массивом');
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
        sellersMap[seller.seller_id || seller.id] = seller;
    }
    
    const productsMap = {};
    for (let i = 0; i < data.products.length; i++) {
        const product = data.products[i];
        productsMap[product.sku] = product;
    }
    
    // Подготовка статистики продавцов
    const sellerStats = {};
    
    // Обработка записей о продажах
    for (let i = 0; i < data.purchase_records.length; i++) {
        const record = data.purchase_records[i];
        const sellerId = record.seller_id;
        
        // Получаем информацию о продавце
        const seller = sellersMap[sellerId];
        if (!seller) {
            continue; // Пропускаем записи с неизвестным продавцом
        }
        
        // Инициализируем статистику продавца, если её ещё нет
        if (!sellerStats[sellerId]) {
            sellerStats[sellerId] = {
                seller_id: sellerId,
                name: (seller.first_name || '') + ' ' + (seller.last_name || ''),
                revenue: 0,
                profit: 0,
                sales_count: 0,
                products_sold: {}
            };
        }
        
        const stats = sellerStats[sellerId];
        stats.sales_count++;
        
        // Определяем, где находятся товары: в record.items или непосредственно в record
        let items = [];
        if (record.items && Array.isArray(record.items)) {
            items = record.items;
        } else if (record.product_sku) {
            // Если запись содержит один товар напрямую
            items = [record];
        }
        
        // Обрабатываем каждый товар
        for (let j = 0; j < items.length; j++) {
            const item = items[j];
            const productSku = item.sku || item.product_sku;
            const product = productsMap[productSku];
            
            if (!product) {
                continue; // Пропускаем товары, которых нет в каталоге
            }
            
            const quantity = item.quantity || 0;
            const discount = item.discount || 0;
            const salePrice = item.sale_price || item.sale || 0;
            
            // Расчет себестоимости
            const costPrice = product.cost_price || product.purchase_price || 0;
            const cost = costPrice * quantity;
            
            // Расчет выручки
            const purchaseData = {
                discount: discount,
                sale: salePrice,
                sale_price: salePrice,
                quantity: quantity
            };
            
            let revenue = 0;
            try {
                revenue = calculateRevenue(purchaseData, product);
                if (isNaN(revenue)) revenue = 0;
            } catch (e) {
                revenue = 0;
            }
            
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
        let bonus = 0;
        try {
            bonus = calculateBonus(i, total, { profit: seller.profit });
            if (isNaN(bonus)) bonus = 0;
        } catch (e) {
            bonus = 0;
        }
        
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
        
        // Округляем значения
        const revenue = Number(seller.revenue.toFixed(2));
        const profit = Number(seller.profit.toFixed(2));
        const bonusAmount = Number(bonus.toFixed(2));
        
        // Добавляем в результат
        result.push({
            seller_id: seller.seller_id,
            name: seller.name,
            revenue: revenue,
            profit: profit,
            sales_count: seller.sales_count,
            top_products: topProducts,
            bonus: bonusAmount
        });
    }
    
    return result;
}