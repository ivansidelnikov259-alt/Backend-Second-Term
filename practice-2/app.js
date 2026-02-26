const express = require('express');
const app = express();
const port = 3000;

// Middleware для парсинга JSON
app.use(express.json());

// База данных в памяти (массив с товарами)
let products = [
    { id: 1, name: 'Смартфон SuperPhone 15', price: 79990 },
    { id: 2, name: 'Ноутбук ProBook Ultra', price: 124990 },
    { id: 3, name: 'Наушники SoundMax Pro', price: 8990 },
    { id: 4, name: 'Умные часы WatchFit 5', price: 15990 },
    { id: 5, name: 'Планшет TabMate 11', price: 45990 }
];

// ============== CRUD ОПЕРАЦИИ ==============

// CREATE (POST) - создание нового товара
app.post('/products', (req, res) => {
    const { name, price } = req.body;
    
    // Проверяем, что переданы все необходимые поля
    if (!name || !price) {
        return res.status(400).json({ 
            error: 'Не хватает данных. Нужны name и price' 
        });
    }
    
    // Создаем новый товар с уникальным ID
    const newProduct = {
        id: products.length + 1, // Простой способ генерации ID
        name: name,
        price: price
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// READ ALL (GET) - получение всех товаров
app.get('/products', (req, res) => {
    res.json(products);
});

// READ ONE (GET) - получение одного товара по ID
app.get('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    
    if (!product) {
        return res.status(404).json({ 
            error: 'Товар не найден' 
        });
    }
    
    res.json(product);
});

// UPDATE (PATCH) - обновление товара по ID
app.patch('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { name, price } = req.body;
    const product = products.find(p => p.id === id);
    
    if (!product) {
        return res.status(404).json({ 
            error: 'Товар не найден' 
        });
    }
    
    // Обновляем только те поля, которые передали
    if (name) product.name = name;
    if (price) product.price = price;
    
    res.json(product);
});

// DELETE (DELETE) - удаление товара по ID
app.delete('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
        return res.status(404).json({ 
            error: 'Товар не найден' 
        });
    }
    
    products.splice(productIndex, 1);
    res.status(204).send(); // 204 - успешно, но без тела ответа
});

// ============== ДЛЯ ТЕСТА В БРАУЗЕРЕ ==============
app.get('/', (req, res) => {
    res.send(`
        <h1>API магазина работает</h1>
        <p>Доступные маршруты:</p>
        <ul>
            <li><a href="/products">GET /products</a> - все товары</li>
            <li>GET /products/:id - товар по ID</li>
            <li>POST /products - создать товар</li>
            <li>PATCH /products/:id - обновить товар</li>
            <li>DELETE /products/:id - удалить товар</li>
        </ul>
        <p>Для теста API используй Postman или Bruno</p>
    `);
});

// Запуск сервера
app.listen(port, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${port}`);
    console.log(`📦 Товаров в базе: ${products.length}`);
    console.log(`📝 Попробуй: http://localhost:${port}/products`);
});