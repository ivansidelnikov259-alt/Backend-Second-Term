const express = require('express');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// ВАШИ VAPID-КЛЮЧИ
const vapidKeys = {
    publicKey: 'BP8HW_dXLLpReEnuuAz7ChH_A1O8YDPtVDgyhncM2OIu7hW13ZsPpVoVzrc7GucJqPnNy1yMT_Uoy05ht6JO5Ak',
    privateKey: 'hSE_Ja3QAFf5i9uYOjIjvBu-TxretGYB1XsWepLWdzk'
};

webpush.setVapidDetails(
    'mailto:your-email@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

let subscriptions = [];
const reminders = new Map();

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

// ===== ОТКЛАДЫВАНИЕ НАПОМИНАНИЯ =====
app.post('/snooze', (req, res) => {
    const reminderId = req.query.reminderId;
    console.log(`⏰ Запрос на откладывание напоминания ${reminderId}`);
    
    if (!reminderId || !reminders.has(reminderId)) {
        console.log(`⚠️ Напоминание ${reminderId} не найдено`);
        return res.status(400).json({ error: 'Reminder not found' });
    }

    const reminder = reminders.get(reminderId);
    
    // Отменяем старый таймер
    if (reminder.timeoutId) {
        clearTimeout(reminder.timeoutId);
    }

    // Новый таймер на 1 минуту
    const newDelay = 60 * 1000;
    const newTimeoutId = setTimeout(() => {
        console.log(`🔔 ОТЛОЖЕННОЕ НАПОМИНАНИЕ: ${reminder.text}`);
        
        const payload = JSON.stringify({
            title: '⏰ Напоминание',
            body: reminder.text,
            reminderId: reminderId
        });

        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => {
                console.error('Push error:', err);
                if (err.statusCode === 410) {
                    subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
                }
            });
        });
        
        // НЕ УДАЛЯЕМ! Ждём следующего откладывания или закрытия
        console.log(`📌 Напоминание ${reminderId} отправлено, но остаётся в хранилище для возможного откладывания`);
        
    }, newDelay);

    reminders.set(reminderId, {
        timeoutId: newTimeoutId,
        text: reminder.text,
        reminderTime: Date.now() + newDelay
    });

    console.log(`⏰ Напоминание ${reminderId} отложено на 1 минуту`);
    res.status(200).json({ message: 'Reminder snoozed for 1 minute' });
});

// ===== УДАЛЕНИЕ НАПОМИНАНИЯ (когда пользователь закрыл уведомление) =====
app.post('/dismiss', (req, res) => {
    const reminderId = req.query.reminderId;
    console.log(`❌ Запрос на удаление напоминания ${reminderId}`);
    
    if (reminderId && reminders.has(reminderId)) {
        const reminder = reminders.get(reminderId);
        if (reminder.timeoutId) {
            clearTimeout(reminder.timeoutId);
        }
        reminders.delete(reminderId);
        console.log(`🗑️ Напоминание ${reminderId} удалено`);
    }
    res.status(200).json({ message: 'Dismissed' });
});

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

    // Обычная заметка
    socket.on('newTask', (task) => {
        console.log('📝 Новая задача:', task.text);
        io.emit('taskAdded', task);
        
        const payload = JSON.stringify({
            title: '📝 Новая заметка',
            body: task.text,
            reminderId: null
        });
        
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => {
                console.error('Push error:', err);
                if (err.statusCode === 410) {
                    subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
                }
            });
        });
    });

    // Заметка с напоминанием
    socket.on('newReminder', (reminder) => {
        const { id, text, reminderTime } = reminder;
        const delay = reminderTime - Date.now();
        
        console.log(`⏰ Новое напоминание: ID=${id}, текст="${text}", через ${Math.round(delay / 1000)} секунд`);
        
        if (delay <= 0) {
            console.log('⚠️ Время в прошлом');
            return;
        }

        const timeoutId = setTimeout(() => {
            console.log(`🔔 ОТПРАВКА НАПОМИНАНИЯ: ${text}`);
            
            const payload = JSON.stringify({
                title: '⏰ НАПОМИНАНИЕ',
                body: text,
                reminderId: id
            });

            subscriptions.forEach(sub => {
                webpush.sendNotification(sub, payload).catch(err => {
                    console.error('Push error:', err);
                });
            });
            
            // НЕ УДАЛЯЕМ напоминание! Оно остаётся для возможности откладывания
            console.log(`📌 Напоминание ${id} отправлено, остаётся в хранилище`);
            
        }, delay);

        reminders.set(id, {
            timeoutId: timeoutId,
            text: text,
            reminderTime: reminderTime
        });
        
        console.log(`✅ Напоминание запланировано, активных: ${reminders.size}`);
    });

    socket.on('disconnect', () => {
        console.log('🔴 Клиент отключён:', socket.id);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`✅ HTTPS сервер запущен: https://localhost:${PORT}`);
});