const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3001', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API интернет-магазина',
            version: '1.0.0',
            description: 'Документация для управления товарами в интернет-магазине',
            contact: {
                name: 'Разработчик',
                email: 'your-email@example.com'
            }
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер'
            }
        ],
        components: {
            schemas: {
                Product: {
                    type: 'object',
                    required: ['name', 'price'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Уникальный идентификатор товара',
                            example: 'abc12345'
                        },
                        name: {
                            type: 'string',
                            description: 'Название товара',
                            example: 'Смартфон iPhone 15 Pro'
                        },
                        price: {
                            type: 'number',
                            description: 'Цена в рублях',
                            example: 99990
                        },
                        description: {
                            type: 'string',
                            description: 'Описание товара',
                            example: 'Флагманский смартфон с титановым корпусом'
                        },
                        category: {
                            type: 'string',
                            description: 'Категория товара',
                            example: 'Смартфоны'
                        },
                        stock: {
                            type: 'number',
                            description: 'Количество на складе',
                            example: 10
                        },
                        imageUrl: {
                            type: 'string',
                            description: 'URL изображения товара',
                            example: 'https://img.mvideo.ru/Pdb/30058540b.jpg'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Сообщение об ошибке'
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Products',
                description: 'Управление товарами'
            }
        ]
    },
    apis: ['./app.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI по адресу /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Товары для интернет-магазина
let products = [
    { 
        id: nanoid(8),
        name: 'Игровой ноутбук ASUS ROG',
        price: 149990,
        description: 'Мощный игровой ноутбук с RTX 4060, 16GB RAM, 1TB SSD',
        category: 'Ноутбуки',
        stock: 5,
        imageUrl: 'https://ir.ozone.ru/s3/multimedia-8/6090112472.jpg'
    },
    { 
        id: nanoid(8),
        name: 'Смартфон iPhone 17 Pro',
        price: 119990,
        description: 'Флагманский смартфон с алюминиевым корпусом',
        category: 'Смартфоны',
        stock: 10,
        imageUrl: 'https://avatars.mds.yandex.net/get-mpic/13594757/2a000001994ea791f2a58ac3cf1f0b5cccfc/orig'
    },
    { 
        id: nanoid(8),
        name: 'Наушники Sony WH-1000XM5',
        price: 29990,
        description: 'Беспроводные наушники с активным шумоподавлением',
        category: 'Аудио',
        stock: 15,
        imageUrl: 'https://ir.ozone.ru/s3/multimedia-c/6831239772.jpg'
    },
    { 
        id: nanoid(8),
        name: 'Монитор Samsung Odyssey G7',
        price: 64990,
        description: '32" изогнутый монитор, 240Hz, 4K',
        category: 'Мониторы',
        stock: 3,
        imageUrl: 'https://main-cdn.sbermegamarket.ru/big2/hlr-system/-14/493/319/084/271/045/600011714040b2.jpeg'
    },
    { 
        id: nanoid(8),
        name: 'Клавиатура Logitech MX Mechanical',
        price: 15990,
        description: 'Механическая клавиатура с низким профилем',
        category: 'Периферия',
        stock: 7,
        imageUrl: 'https://avatars.mds.yandex.net/get-mpic/12368623/2a0000019522ddfe3120983b242e91687ef4/orig'
    },
    { 
        id: nanoid(8),
        name: 'Мышь Razer DeathAdder V3',
        price: 8990,
        description: 'Легкая игровая мышь с сенсором 30K DPI',
        category: 'Периферия',
        stock: 12,
        imageUrl: 'https://avatars.mds.yandex.net/get-mpic/16096063/2a0000019a8aac710217af9986035ecd0b22/orig'
    },
    { 
        id: nanoid(8),
        name: 'Планшет iPad Pro 12.9"',
        price: 99990,
        description: 'M2 чип, 256GB, Liquid Retina XDR дисплей',
        category: 'Планшеты',
        stock: 4,
        imageUrl: 'https://ir.ozone.ru/s3/multimedia-1-o/7001742300.jpg'
    },
    { 
        id: nanoid(8),
        name: 'Умные часы Apple Watch Ultra 2',
        price: 79990,
        description: 'Титановый корпус, всегда включенный дисплей',
        category: 'Носимые устройства',
        stock: 6,
        imageUrl: 'https://avatars.mds.yandex.net/get-mpic/6597196/2a00000193c039653906f0776227e255e478/orig'
    },
    { 
        id: nanoid(8),
        name: 'Внешний SSD Samsung T7 1TB',
        price: 9990,
        description: 'Скорость до 1050 МБ/с, ударопрочный корпус',
        category: 'Хранение данных',
        stock: 20,
        imageUrl: 'https://basket-28.wbbasket.ru/vol5278/part527874/527874469/images/big/1.webp'
    },
    { 
        id: nanoid(8),
        name: 'Роутер TP-Link Archer AX90',
        price: 18990,
        description: 'Wi-Fi 6, скорость до 6600 Мбит/с',
        category: 'Сетевое оборудование',
        stock: 8,
        imageUrl: 'https://i-teh.com/upload/iblock/c2a/btjpk0equvt2khbbkj1qn3iumh16g738.jpg'
    }
];

// Middleware для логирования запросов
app.use((req, res, next) => {
    console.log(`📨 [${new Date().toISOString()}] [${req.method}] ${req.path}`);
    console.log(`   Откуда: ${req.headers.origin || 'прямой запрос'}`);
    res.on('finish', () => {
        console.log(`   Статус: ${res.statusCode}`);
    });
    next();
});

// Функция-помощник для поиска товара
function findProductOr404(id, res) {
    const product = products.find(p => p.id === id);
    if (!product) {
        res.status(404).json({ error: "Товар не найден" });
        return null;
    }
    return product;
}

// ============== CRUD ОПЕРАЦИИ С ДОКУМЕНТАЦИЕЙ ==============

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить все товары
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список всех товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Информация о товаре
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название товара
 *               price:
 *                 type: number
 *                 description: Цена товара
 *               description:
 *                 type: string
 *                 description: Описание товара
 *               category:
 *                 type: string
 *                 description: Категория товара
 *               stock:
 *                 type: number
 *                 description: Количество на складе
 *               imageUrl:
 *                 type: string
 *                 description: URL изображения
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка в данных
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/products', (req, res) => {
    const { name, price, description, category, stock, imageUrl } = req.body;
    
    if (!name || !price) {
        return res.status(400).json({ 
            error: 'Не хватает данных. Нужны name и price' 
        });
    }
    
    const newProduct = {
        id: nanoid(8),
        name: name.trim(),
        price: Number(price),
        description: description || '',
        category: category || 'Разное',
        stock: stock ? Number(stock) : 0,
        imageUrl: imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Новое название
 *               price:
 *                 type: number
 *                 description: Новая цена
 *               description:
 *                 type: string
 *                 description: Новое описание
 *               category:
 *                 type: string
 *                 description: Новая категория
 *               stock:
 *                 type: number
 *                 description: Новое количество
 *               imageUrl:
 *                 type: string
 *                 description: Новый URL изображения
 *     responses:
 *       200:
 *         description: Обновленный товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет данных для обновления
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.patch('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    
    const { name, price, description, category, stock, imageUrl } = req.body;
    
    if (!name && !price && !description && !category && !stock && !imageUrl) {
        return res.status(400).json({ 
            error: "Нет данных для обновления" 
        });
    }
    
    if (name) product.name = name.trim();
    if (price) product.price = Number(price);
    if (description !== undefined) product.description = description;
    if (category) product.category = category;
    if (stock) product.stock = Number(stock);
    if (imageUrl) product.imageUrl = imageUrl;
    
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара для удаления
 *     responses:
 *       204:
 *         description: Товар успешно удален (нет тела ответа)
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const exists = products.some(p => p.id === id);
    
    if (!exists) {
        return res.status(404).json({ error: "Товар не найден" });
    }
    
    products = products.filter(p => p.id !== id);
    res.status(204).send();
});

// 404 для всех остальных маршрутов
app.use((req, res) => {
    res.status(404).json({ error: "Маршрут не найден" });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${port}`);
    console.log(`📦 Товаров в базе: ${products.length}`);
    console.log(`📝 API: http://localhost:${port}/api/products`);
    console.log(`📚 Документация Swagger: http://localhost:${port}/api-docs`);
    console.log(`🔧 CORS разрешен для портов: 3001 и 5173`);
});