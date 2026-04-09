// DOM элементы
const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
const enablePushBtn = document.getElementById('enable-push');
const disablePushBtn = document.getElementById('disable-push');

let socket = null;
const SERVER_URL = 'https://localhost:3001';

// Генерация уникального ID
function generateId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Функция для показа уведомлений на сайте
function showSiteNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; 
        bottom: 20px; 
        right: 20px; 
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#4285f4'}; 
        color: white; 
        padding: 12px 20px; 
        border-radius: 8px; 
        z-index: 9999; 
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// CSS анимация
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// ----- Навигация (App Shell) -----
function setActiveButton(activeId) {
    [homeBtn, aboutBtn].forEach(btn => btn.classList.remove('active'));
    document.getElementById(activeId).classList.add('active');
}

async function loadContent(page) {
    try {
        const response = await fetch(`/content/${page}.html`);
        const html = await response.text();
        contentDiv.innerHTML = html;

        if (page === 'home') {
            initNotes();
        }
    } catch (err) {
        contentDiv.innerHTML = '<p class="is-center text-error">Ошибка загрузки страницы</p>';
        console.error(err);
    }
}

homeBtn.addEventListener('click', () => {
    setActiveButton('home-btn');
    loadContent('home');
});
aboutBtn.addEventListener('click', () => {
    setActiveButton('about-btn');
    loadContent('about');
});

// ----- Работа с заметками (localStorage) -----
function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const list = document.getElementById('notes-list');
    if (!list) return;
    
    if (notes.length === 0) {
        list.innerHTML = '<li>📭 Нет заметок</li>';
        return;
    }
    
    list.innerHTML = notes.map((note, index) => {
        let reminderInfo = '';
        if (note.reminder) {
            const date = new Date(note.reminder);
            reminderInfo = `<br><small>⏰ Напоминание: ${date.toLocaleString()}</small>`;
        }
        return `
            <li style="margin-bottom: 0.75rem; padding: 0.75rem; border: 1px solid #eee; border-radius: 8px;">
                📌 ${escapeHtml(note.text)}
                ${reminderInfo}
                <button class="button small error" data-index="${index}" style="margin-left: 1rem; margin-top: 0.5rem;">Удалить</button>
            </li>
        `;
    }).join('');

    document.querySelectorAll('[data-index]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.index);
            const notesArr = JSON.parse(localStorage.getItem('notes') || '[]');
            notesArr.splice(idx, 1);
            localStorage.setItem('notes', JSON.stringify(notesArr));
            loadNotes();
        });
    });
}

// Обычная заметка (без напоминания)
function addNote(text) {
    if (!text.trim()) return;
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.push({ id: generateId(), text: text.trim(), reminder: null });
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();

    showSiteNotification(`✅ Заметка добавлена: ${text.trim()}`, 'success');

    if (socket && socket.connected) {
        socket.emit('newTask', { text: text.trim(), timestamp: Date.now() });
    }
}

// Заметка с напоминанием
function addReminder(text, reminderTime) {
    if (!text.trim() || !reminderTime) return;
    
    const reminderTimestamp = new Date(reminderTime).getTime();
    const now = Date.now();
    
    if (reminderTimestamp <= now) {
        showSiteNotification('❌ Время напоминания должно быть в будущем', 'error');
        return;
    }
    
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const newNote = {
        id: generateId(),
        text: text.trim(),
        reminder: reminderTimestamp
    };
    notes.push(newNote);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
    
    // Отправляем на сервер для планирования push-уведомления
    if (socket && socket.connected) {
        socket.emit('newReminder', {
            id: newNote.id,
            text: text.trim(),
            reminderTime: reminderTimestamp
        });
    }
    
    showSiteNotification(`⏰ Напоминание установлено на ${new Date(reminderTimestamp).toLocaleString()}`, 'success');
}

function initNotes() {
    const form = document.getElementById('note-form');
    const input = document.getElementById('note-input');
    const reminderForm = document.getElementById('reminder-form');
    const reminderText = document.getElementById('reminder-text');
    const reminderTime = document.getElementById('reminder-time');
    
    if (!form) return;

    loadNotes();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text) {
            addNote(text);
            input.value = '';
            input.focus();
        }
    });
    
    if (reminderForm) {
        reminderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = reminderText.value.trim();
            const time = reminderTime.value;
            if (text && time) {
                addReminder(text, time);
                reminderText.value = '';
                reminderTime.value = '';
                reminderText.focus();
            }
        });
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
}

// ----- WebSocket -----
function initSocket() {
    if (typeof io === 'undefined') {
        console.log('⏳ Ожидаем загрузку Socket.IO...');
        setTimeout(initSocket, 500);
        return;
    }
    
    console.log('✅ Socket.IO найден, подключаемся...');
    
    socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true
    });
    
    socket.on('connect', () => {
        console.log('✅ WebSocket подключен');
        showSiteNotification('🔌 WebSocket подключен', 'success');
    });
    
    socket.on('disconnect', () => {
        console.log('❌ WebSocket отключен');
    });
    
    socket.on('taskAdded', (task) => {
        console.log('📥 Получена задача через WebSocket:', task);
        showSiteNotification(`🆕 Новая заметка от другого пользователя: ${task.text}`, 'info');
        if (document.getElementById('notes-list')) {
            loadNotes();
        }
    });
}

// ----- Push-уведомления (Windows) -----
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const VAPID_PUBLIC_KEY = 'BP8HW_dXLLpReEnuuAz7ChH_A1O8YDPtVDgyhncM2OIu7hW13ZsPpVoVzrc7GucJqPnNy1yMT_Uoy05ht6JO5Ak';

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Push-уведомления не поддерживаются');
        return;
    }
    
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        
        const response = await fetch('https://localhost:3001/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
        
        if (response.ok) {
            console.log('✅ Подписка на Push отправлена');
            showSiteNotification('🔔 Push-уведомления включены!', 'success');
            enablePushBtn.style.display = 'none';
            disablePushBtn.style.display = 'inline-block';
        }
    } catch (err) {
        console.error('Ошибка подписки:', err);
        showSiteNotification('❌ Ошибка включения уведомлений', 'error');
    }
}

async function unsubscribeFromPush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await fetch('https://localhost:3001/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            });
            await subscription.unsubscribe();
            console.log('❌ Отписка выполнена');
            showSiteNotification('🔕 Push-уведомления отключены', 'info');
            enablePushBtn.style.display = 'inline-block';
            disablePushBtn.style.display = 'none';
        }
    } catch (err) {
        console.error('Ошибка отписки:', err);
    }
}

// ----- Service Worker регистрация -----
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ SW зарегистрирован:', registration.scope);
            
            const sub = await registration.pushManager.getSubscription();
            if (sub) {
                enablePushBtn.style.display = 'none';
                disablePushBtn.style.display = 'inline-block';
            } else {
                enablePushBtn.style.display = 'inline-block';
                disablePushBtn.style.display = 'none';
            }
            
            enablePushBtn.addEventListener('click', subscribeToPush);
            disablePushBtn.addEventListener('click', unsubscribeFromPush);
        } catch (err) {
            console.error('Ошибка SW:', err);
        }
    });
}

// ----- Инициализация -----
loadContent('home');
initSocket();