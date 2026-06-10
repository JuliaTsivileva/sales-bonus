/**
 * Функция для расчета прибыли
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
// @TODO: Расчет выручки от операции
function calculateSimpleRevenue(purchase, _product) {
  const {discount, sale_price, quantity} = purchase;
  const procent = discount / 100;
  const revenue_fullcost = sale_price * quantity;
  const finalAmount = revenue_fullcost * (1 - procent);
  return finalAmount;

  // return sale_price * quantity * (1 - discount / 100);
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
    const { profit } = seller;
    const position = index + 1; // Преобразуем в 1-индексацию для удобства
    const lastPosition = total;
    
    if (position === 1) {
        // Первое место - 15%
        return profit * 0.15;
    } else if (position === 2 || position === 3) {
        // Второе и третье место - 10%
        return profit * 0.10;
    } else if (position === lastPosition) {
        // Последнее место - 0%
        return 0;
    } else {
        // Все остальные - 5%
        return profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data объект с данными (sellers, products, purchase_records)
 * @param options объект с функциями calculateRevenue и calculateBonus
 * @returns {Object} отчёт с результатами анализа
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchase_records)
    ) {
        throw new Error('Некорректные входные данные: ожидается объект с полями sellers, products, purchase_records (все должны быть массивами)');
    }
    
    if (data.sellers.length === 0
        || data.products.length === 0
        || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные: массивы sellers, products, purchase_records не должны быть пустыми');
    }
    
    // @TODO: Проверка наличия опций
    if (!options || typeof options !== 'object') {
        throw new Error('Некорректные опции: ожидается объект с функциями calculateRevenue и calculateBonus');
    }
    
    const { calculateRevenue, calculateBonus } = options;
    
    if (typeof calculateRevenue !== 'function') {
        throw new Error('Некорректные опции: calculateRevenue должен быть функцией');
    }
    
    if (typeof calculateBonus !== 'function') {
        throw new Error('Некорректные опции: calculateBonus должен быть функцией');
    }
    
    // @TODO: Подготовка промежуточных данных для сбора статистики
    // Создаём начальную статистику для каждого продавца
    let sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));
    
    // @TODO: Индексация продавцов и товаров для быстрого доступа
    // Индекс продавцов по ID
    const sellerIndex = {};
    sellerStats.forEach(seller => {
        sellerIndex[seller.seller_id] = seller;
    });
    
    // Индекс товаров по SKU
    const productIndex = {};
    data.products.forEach(product => {
        productIndex[product.sku] = product;
    });
    
    // @TODO: Расчёт выручки и прибыли для каждого продавца
    // Перебираем все записи о продажах (чеки)
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        
        if (!seller) {
            // Пропускаем запись, если продавец не найден
            console.warn(`Продавец с id ${record.seller_id} не найден`);
            return;
        }
        
        // Увеличиваем количество продаж
        seller.sales_count += 1;
        
        // Перебираем товары в чеке
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            
            if (!product) {
                console.warn(`Товар с SKU ${item.sku} не найден в каталоге`);
                return;
            }
            
            // Расчёт себестоимости товара
            const cost = product.purchase_price * item.quantity;
            
            // Расчёт выручки с учётом скидки
            const purchaseData = {
                discount: item.discount || 0,
                sale_price: item.sale_price,
                quantity: item.quantity
            };
            const revenue = calculateRevenue(purchaseData, product);
            
            // Расчёт прибыли
            const profit = revenue - cost;
            
            // Обновляем общую выручку продавца
            seller.revenue += revenue;
            
            // Обновляем общую прибыль продавца
            seller.profit += profit;
            
            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });
    
    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);
    
    // @TODO: Назначение премий на основе ранжирования
    const totalSellers = sellerStats.length;
    
    sellerStats.forEach((seller, index) => {
        // Рассчитываем бонус с помощью переданной функции
        const bonus = calculateBonus(index, totalSellers, { profit: seller.profit });
        seller.bonus = Number(bonus.toFixed(2));
        
        // @TODO: Подготовка итоговой коллекции с нужными полями
        // Формируем топ-10 товаров
        const topProducts = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
        
        seller.top_products = topProducts;
        
        // Округляем числовые значения до 2 знаков
        seller.revenue = Number(seller.revenue.toFixed(2));
        seller.profit = Number(seller.profit.toFixed(2));
    });
    
    // @TODO: Формирование итогового отчёта
    return sellerStats.map(seller => ({
        seller_id: seller.seller_id,
        name: seller.name,
        revenue: seller.revenue,
        profit: seller.profit,
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: seller.bonus
    }));
}

// Тестирование с вашими данными
try {
    const result = analyzeSalesData(data, {
        calculateRevenue: calculateSimpleRevenue,
        calculateBonus: calculateBonusByProfit
    });
    
    console.log('Результат анализа продаж:');
    console.log('=========================');
    
    result.forEach((seller, idx) => {
        console.log(`\n${idx + 1}. ${seller.name} (${seller.seller_id})`);
        console.log(`   Продаж: ${seller.sales_count}`);
        console.log(`   Выручка: ${seller.revenue.toFixed(2)} руб.`);
        console.log(`   Прибыль: ${seller.profit.toFixed(2)} руб.`);
        console.log(`   Бонус: ${seller.bonus.toFixed(2)} руб.`);
        console.log(`   Топ товаров:`, seller.top_products.slice(0, 3));
    });
    
    // Итоговая статистика
    const totalRevenue = result.reduce((sum, s) => sum + s.revenue, 0);
    const totalProfit = result.reduce((sum, s) => sum + s.profit, 0);
    const totalBonuses = result.reduce((sum, s) => sum + s.bonus, 0);
    
    console.log('\n=========================');
    console.log('Общая статистика:');
    console.log(`Общая выручка: ${totalRevenue.toFixed(2)} руб.`);
    console.log(`Общая прибыль: ${totalProfit.toFixed(2)} руб.`);
    console.log(`Общие бонусы: ${totalBonuses.toFixed(2)} руб.`);
    
} catch (error) {
    console.error('Ошибка:', error.message);
}