import React from 'react';

function App() {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      fontFamily: 'Arial',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#3498db' }}>✅ React работает!</h1>
      <p>Если ты видишь это сообщение, React запущен правильно.</p>
      <p>Теперь проверим подключение к серверу...</p>
    </div>
  );
}

export default App;