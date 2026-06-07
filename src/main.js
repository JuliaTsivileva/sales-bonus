/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
   // @TODO: Расчет выручки от операции
  function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;

    const priceWithDiscount = sale_price - discount;

    return priceWithDiscount * quantity;
  }

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
    // @TODO: Расчет бонуса от позиции в рейтинге
  function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;

    const percent = (total - index) / total;

    return profit * percent;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
/**
 * Функция для расчета выручки
 */

function analyzeSalesData(data, options) {

    // ШАГ 1: проверка данных
    if (
        !data
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchase_records)
        || data.sellers.length === 0
        || data.products.length === 0
        || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    // ШАГ 2: проверка options
    if (!options || typeof options !== 'object') {
        throw new Error('Некорректные опции');
    }

    const { calculateRevenue, calculateBonus } = options;

    if (
        !calculateRevenue
        || !calculateBonus
        || typeof calculateRevenue !== 'function'
        || typeof calculateBonus !== 'function'
    ) {
        throw new Error('Некорректные функции в options');
    }

    // ШАГ 3: sellerStats
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // ШАГ 4: sellerIndex
    const sellerIndex = Object.fromEntries(
        sellerStats.map(seller => [seller.id, seller])
    );

    // ШАГ 5: productIndex
    const productIndex = Object.fromEntries(
        data.products.map(product => [product.sku, product])
    );

  data.purchase_records.forEach(record => {

    const seller = sellerIndex[record.seller_id];

    seller.sales_count += 1;

    let totalRevenue = 0;
    let totalProfit = 0;

    record.items.forEach(item => {

        const product = productIndex[item.sku];

        if (!product) return; // защита

        const cost = product.purchase_price * item.quantity;

        const revenue = calculateRevenue(item, product);

        const profit = revenue - cost;

        totalRevenue += revenue;
        totalProfit += profit;

        if (!seller.products_sold[item.sku]) {
            seller.products_sold[item.sku] = 0;
        }

        seller.products_sold[item.sku] += item.quantity;
    });

    seller.revenue += totalRevenue;
    seller.profit += totalProfit;
});

sellerStats.sort((a, b) => b.profit - a.profit);
sellerStats.forEach((seller, index, array) => {

    const total = array.length;

    // =========================
    // 🟢 БОНУС
    // =========================
    seller.bonus = calculateBonusByProfit(index, total, seller);

    // =========================
    // 🟢 TOP-10 ПРОДУКТОВ
    // =========================
    seller.top_products = Object.entries(seller.products_sold)
        .map(([sku, quantity]) => ({
            sku,
            quantity
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
});
return sellerStats.map(seller => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2)
}));
console.table([
  {a: 1, b: 2},
  {a: 3, b: 4}
]);
    // @TODO: Подготовка промежуточных данных для сбора статистики

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    // @TODO: Расчет выручки и прибыли для каждого продавца

    // @TODO: Сортировка продавцов по прибыли

    // @TODO: Назначение премий на основе ранжирования

    // @TODO: Подготовка итоговой коллекции с нужными полями
}
