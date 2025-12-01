require('dotenv').config();
const app = require('./src/app');
const { setupWebSocket } = require('./src/services/websocket.service');

const PORT = process.env.PORT || 3004;

const server = app.listen(PORT, () => {
    console.log(`🔔 Notification Service running on port ${PORT}`);
});

// Setup WebSocket
setupWebSocket(server);