const express = require('express');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const vapidKeys = {
    publicKey: 'BP8HW_dXLLpReEnuuAz7ChH_A1O8YDPtVDgyhncM2OIu7hW13ZsPpVoVzrc7GucJqPnNy1yMT_Uoy05ht6JO5Ak',
    privateKey: 'hSE_Ja3QAFf5i9uYOjIjvBu-TxretGYB1XsWepLWdzk'
};

webpush.setVapidDetails(
    'mailto:ivan.sidelnikov21@yandex.ru', 
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './'))); // раздаём статику

// Хранилище подписок
let subscriptions = [];

// Эндпоинты для push
app.post('/subscribe', (req, res) => {
    subscriptions.push(req.body);
    console.log('✅ Новая подписка, всего:', subscriptions.length);
    res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
    console.log('❌ Подписка удалена, осталось:', subscriptions.length);
    res.status(200).json({ message: 'Подписка удалена' });
});

// HTTPS опции (сертификаты от mkcert)
const options = {
    key: fs.readFileSync('localhost-key.pem'),
    cert: fs.readFileSync('localhost.pem')
};

const server = https.createServer(options, app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    console.log('🟢 Клиент подключён:', socket.id);

    socket.on('newTask', (task) => {
        console.log('📝 Новая задача:', task.text);
        // Рассылаем всем клиентам
        io.emit('taskAdded', task);

        // Push-уведомления всем подписанным
        const payload = JSON.stringify({
            title: '✏️ Новая заметка',
            body: task.text.length > 50 ? task.text.slice(0, 50) + '…' : task.text
        });
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => {
                console.error('Push ошибка:', err);
                // удаляем невалидную подписку
                if (err.statusCode === 410) {
                    subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
                }
            });
        });
    });

    socket.on('disconnect', () => {
        console.log('🔴 Клиент отключён:', socket.id);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`✅ HTTPS сервер запущен: https://localhost:${PORT}`);
});