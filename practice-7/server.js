const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your_secret_key';
const ACCESS_EXPIRES_IN = '15m';

// ========== КРИТИЧЕСКИ ВАЖНО: MIDDLEWARE В ПРАВИЛЬНОМ ПОРЯДКЕ ==========
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Эти middleware ДОЛЖНЫ быть перед всеми маршрутами
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Добавим middleware для логирования всех запросов
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// ========== ТЕСТОВЫЙ МАРШРУТ ==========
app.get('/test', (req, res) => {
    res.json({ 
        message: '✅ Сервер работает!',
        bodyParser: 'активен'
    });
});

// ========== ХРАНИЛИЩА ==========
let users = [];
let products = [];

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Не авторизован' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Неверный или просроченный токен' });
    }
}

// ========== МАРШРУТЫ АУТЕНТИФИКАЦИИ ==========

// РЕГИСТРАЦИЯ
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('📝 Регистрация - получен запрос');
        console.log('📦 Тело запроса:', req.body);
        
        // Проверяем, есть ли тело запроса
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ 
                error: 'Тело запроса пустое. Убедитесь, что отправляете JSON с правильными заголовками'
            });
        }
        
        const { email, password, first_name, last_name } = req.body;

        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({ 
                error: 'Все поля обязательны',
                received: req.body,
                required: ['email', 'password', 'first_name', 'last_name']
            });
        }

        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email уже используется' });
        }

        const hashedPassword = await hashPassword(password);
        const newUser = {
            id: nanoid(),
            email,
            first_name,
            last_name,
            hashedPassword
        };

        users.push(newUser);
        console.log('✅ Пользователь создан:', newUser.id);
        
        res.status(201).json({
            id: newUser.id,
            email: newUser.email,
            first_name: newUser.first_name,
            last_name: newUser.last_name
        });
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        res.status(500).json({ error: error.message });
    }
});

// ВХОД (ПОЧТА И ПАРОЛЬ)
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('🔑 Вход - получен запрос');
        console.log('📦 Тело запроса:', req.body);
        
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'email и password обязательны' });
        }

        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }

        const isValid = await verifyPassword(password, user.hashedPassword);
        if (!isValid) {
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }

        const accessToken = jwt.sign(
            { sub: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: ACCESS_EXPIRES_IN }
        );

        res.json({ accessToken });
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        res.status(500).json({ error: error.message });
    }
});

// ПРОФИЛЬ
app.get('/api/auth/me', authMiddleware, (req, res) => {
    const user = users.find(u => u.id === req.user.sub);
    
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
    });
});

// ========== МАРШРУТЫ ДЛЯ ТОВАРОВ ==========

// СОЗДАТЬ ТОВАР
app.post('/api/products', authMiddleware, (req, res) => {
    const { title, category, description, price } = req.body;

    if (!title || !category || !description || price === undefined) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const newProduct = {
        id: nanoid(),
        title,
        category,
        description,
        price: Number(price),
        created_by: req.user.sub
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

// ВСЕ ТОВАРЫ
app.get('/api/products', (req, res) => {
    res.json(products);
});

// ТОВАР ПО ID
app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    
    if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    res.json(product);
});

// ОБНОВИТЬ ТОВАР
app.put('/api/products/:id', authMiddleware, (req, res) => {
    const { title, category, description, price } = req.body;
    const productIndex = products.findIndex(p => p.id === req.params.id);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Товар не найден' });
    }

    if (products[productIndex].created_by !== req.user.sub) {
        return res.status(403).json({ error: 'Нет прав на редактирование' });
    }

    products[productIndex] = {
        ...products[productIndex],
        ...(title && { title }),
        ...(category && { category }),
        ...(description && { description }),
        ...(price !== undefined && { price: Number(price) })
    };

    res.json(products[productIndex]);
});

// УДАЛИТЬ ТОВАР
app.delete('/api/products/:id', authMiddleware, (req, res) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Товар не найден' });
    }

    if (products[productIndex].created_by !== req.user.sub) {
        return res.status(403).json({ error: 'Нет прав на удаление' });
    }

    products.splice(productIndex, 1);
    res.json({ message: 'Товар удален' });
});

// ========== ЗАПУСК СЕРВЕРА ==========
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
    console.log(`🔧 Тест: http://localhost:${PORT}/test`);
    console.log(`📚 Маршруты:`);
    console.log(`   POST  /api/auth/register`);
    console.log(`   POST  /api/auth/login`);
    console.log(`   GET   /api/auth/me (требует токен)`);
    console.log(`   POST  /api/products (требует токен)`);
    console.log(`   GET   /api/products`);
    console.log(`   GET   /api/products/:id`);
    console.log(`   PUT   /api/products/:id (требует токен)`);
    console.log(`   DELETE /api/products/:id (требует токен)`);
    console.log(`=================================`);
});