const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Секреты для токенов
const ACCESS_SECRET = 'your_access_secret_key_here';
const REFRESH_SECRET = 'your_refresh_secret_key_here';

// Время жизни токенов
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

// ========== MIDDLEWARE ==========
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'], // Разрешаем несколько портов
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', req.body);
    }
    next();
});

// ========== ХРАНИЛИЩА ==========
let users = [];
let products = [
    {
        id: '1',
        title: 'Смартфон Samsung Galaxy S25 ULTRA',
        category: 'Электроника',
        description: 'Современный смартфон с отличной камерой 512 GB',
        price: 120000,
        imageUrl: 'https://p.turbosquid.com/ts-thumb/1C/zWDi7b/Ln/d7/jpg/1754348689/1920x1080/fit_q87/46f135b06234b3cc36a1d663b142170f7c2cc84e/d7.jpg', // Фото телефона
        created_by: 'admin',
        created_at: new Date().toISOString()
    },
    {
        id: '2',
        title: 'Ноутбук Apple MacBook PRO',
        category: 'Электроника',
        description: 'Мощный ноутбук для работы 512 GB',
        price: 120000,
        imageUrl: 'https://trashbox.ru/ifiles2/2073989_8f191e_image.png_minx2.jpg/macbook-air-13-m4-obzor-19.webp', // Фото MacBook
        created_by: 'admin',
        created_at: new Date().toISOString()
    },
    {
        id: '3',
        title: 'Наушники JBL TUNE 780 NC',
        category: 'Аудио',
        description: 'Беспроводные наушники с активным шумоподавлением',
        price: 20000,
        imageUrl: 'https://cdn1.technopark.ru/technopark/photos_resized/product/1000_1000/811584/7_811584.jpeg?timestamp=2025-12-01_10-42-46', // Фото наушников
        created_by: 'admin',
        created_at: new Date().toISOString()
    }
];
let refreshTokens = new Set(); // Хранилище активных refresh-токенов

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

function generateAccessToken(user) {
    return jwt.sign(
        { 
            sub: user.id, 
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name
        },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        { 
            sub: user.id, 
            email: user.email,
            role: user.role
        },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
}

// Middleware для проверки аутентификации
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Не авторизован' });
    }

    try {
        const payload = jwt.verify(token, ACCESS_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Неверный или просроченный токен' });
    }
}

// Middleware для проверки ролей
function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Не авторизован' });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Недостаточно прав' });
        }
        
        next();
    };
}

// ========== ТЕСТОВЫЙ МАРШРУТ ==========
app.get('/test', (req, res) => {
    res.json({ 
        message: '✅ Сервер работает!',
        bodyParser: 'активен'
    });
});

// ========== МАРШРУТЫ АУТЕНТИФИКАЦИИ ==========

// РЕГИСТРАЦИЯ
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, first_name, last_name } = req.body;

        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({ 
                error: 'Все поля обязательны',
                required: ['email', 'password', 'first_name', 'last_name']
            });
        }

        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email уже используется' });
        }

        const hashedPassword = await hashPassword(password);
        
        // По умолчанию создаем пользователя с ролью 'user'
        // Первый зарегистрированный пользователь становится админом (для удобства)
        const isFirstUser = users.length === 0;
        const role = isFirstUser ? 'admin' : 'user';
        
        const newUser = {
            id: nanoid(),
            email,
            first_name,
            last_name,
            hashedPassword,
            role,
            isActive: true,
            created_at: new Date().toISOString()
        };

        users.push(newUser);
        console.log('✅ Пользователь создан:', { id: newUser.id, email: newUser.email, role: newUser.role });
        
        res.status(201).json({
            id: newUser.id,
            email: newUser.email,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            role: newUser.role
        });
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        res.status(500).json({ error: error.message });
    }
});

// ВХОД
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'email и password обязательны' });
        }

        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }
        
        // Проверяем, активен ли пользователь
        if (user.isActive === false) {
            return res.status(403).json({ error: 'Пользователь заблокирован' });
        }

        const isValid = await verifyPassword(password, user.hashedPassword);
        if (!isValid) {
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        
        refreshTokens.add(refreshToken);

        res.json({ 
            accessToken, 
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        res.status(500).json({ error: error.message });
    }
});

// ОБНОВЛЕНИЕ ТОКЕНОВ
app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        return res.status(400).json({ error: 'refreshToken обязателен' });
    }
    
    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: 'Неверный refresh токен' });
    }
    
    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = users.find(u => u.id === payload.sub);
        
        if (!user) {
            return res.status(401).json({ error: 'Пользователь не найден' });
        }
        
        if (user.isActive === false) {
            return res.status(403).json({ error: 'Пользователь заблокирован' });
        }
        
        // Удаляем старый refresh токен
        refreshTokens.delete(refreshToken);
        
        // Создаем новую пару токенов
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        
        refreshTokens.add(newRefreshToken);
        
        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
        
    } catch (err) {
        refreshTokens.delete(refreshToken);
        return res.status(401).json({ error: 'Неверный или просроченный refresh токен' });
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
        last_name: user.last_name,
        role: user.role
    });
});

// ВЫХОД (удаление refresh токена)
app.post('/api/auth/logout', authMiddleware, (req, res) => {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
        refreshTokens.delete(refreshToken);
    }
    
    res.json({ message: 'Выход выполнен успешно' });
});

// ========== МАРШРУТЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ (ТОЛЬКО АДМИН) ==========

// ПОЛУЧИТЬ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
app.get('/api/users', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const safeUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        isActive: user.isActive,
        created_at: user.created_at
    }));
    res.json(safeUsers);
});

// ПОЛУЧИТЬ ПОЛЬЗОВАТЕЛЯ ПО ID
app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        isActive: user.isActive,
        created_at: user.created_at
    });
});

// ОБНОВИТЬ ПОЛЬЗОВАТЕЛЯ
app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const { first_name, last_name, role, isActive } = req.body;
    
    if (first_name) users[userIndex].first_name = first_name;
    if (last_name) users[userIndex].last_name = last_name;
    if (role && ['user', 'seller', 'admin'].includes(role)) users[userIndex].role = role;
    if (isActive !== undefined) users[userIndex].isActive = isActive;
    
    res.json({
        id: users[userIndex].id,
        email: users[userIndex].email,
        first_name: users[userIndex].first_name,
        last_name: users[userIndex].last_name,
        role: users[userIndex].role,
        isActive: users[userIndex].isActive
    });
});

// УДАЛИТЬ/ЗАБЛОКИРОВАТЬ ПОЛЬЗОВАТЕЛЯ
app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Мягкое удаление - блокировка
    users[userIndex].isActive = false;
    
    // Удаляем все refresh токены пользователя
    const userRefreshTokens = Array.from(refreshTokens).filter(token => {
        try {
            const payload = jwt.verify(token, REFRESH_SECRET);
            return payload.sub === req.params.id;
        } catch {
            return false;
        }
    });
    userRefreshTokens.forEach(token => refreshTokens.delete(token));
    
    res.json({ message: 'Пользователь заблокирован' });
});

// ========== МАРШРУТЫ ДЛЯ ТОВАРОВ ==========

// СОЗДАТЬ ТОВАР (Продавец и Админ)
app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
    const { title, category, description, price, imageUrl } = req.body;

    if (!title || !category || !description || price === undefined) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const newProduct = {
        id: nanoid(),
        title,
        category,
        description,
        price: Number(price),
        imageUrl: imageUrl || 'https://via.placeholder.com/400x300?text=No+Image', // Если нет фото - заглушка
        created_by: req.user.sub,
        created_at: new Date().toISOString()
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

// ВСЕ ТОВАРЫ (Доступно всем, включая неавторизованных)
app.get('/api/products', (req, res) => {
    res.json(products);
});

// ТОВАР ПО ID (Доступно всем)
app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    
    if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    res.json(product);
});

// ОБНОВИТЬ ТОВАР (Продавец и Админ)
app.put('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
    const { title, category, description, price, imageUrl } = req.body;
    const productIndex = products.findIndex(p => p.id === req.params.id);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Товар не найден' });
    }

    // Проверяем, что продавец редактирует свой товар, а админ может редактировать любой
    if (req.user.role !== 'admin' && products[productIndex].created_by !== req.user.sub) {
        return res.status(403).json({ error: 'Нет прав на редактирование этого товара' });
    }

    products[productIndex] = {
        ...products[productIndex],
        ...(title && { title }),
        ...(category && { category }),
        ...(description && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(imageUrl && { imageUrl }), // Добавляем фото
        updated_at: new Date().toISOString()
    };

    res.json(products[productIndex]);
});


// УДАЛИТЬ ТОВАР (Только Админ)
app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Товар не найден' });
    }

    products.splice(productIndex, 1);
    res.json({ message: 'Товар удален' });
});

// ========== ЗАПУСК СЕРВЕРА ==========
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
    console.log(`🔧 Тест: http://localhost:${PORT}/test`);
    console.log(`=================================`);
});