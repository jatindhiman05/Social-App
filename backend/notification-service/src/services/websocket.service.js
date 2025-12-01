const WebSocket = require('ws');

class WebSocketService {
    constructor() {
        this.wss = null;
        this.connectedUsers = new Map(); // userId -> WebSocket connection
    }

    setup(server) {
        this.wss = new WebSocket.Server({ server });

        this.wss.on('connection', (ws, req) => {
            console.log('New WebSocket connection');

            // Extract userId from query parameters
            const url = new URL(req.url, `http://${req.headers.host}`);
            const userId = url.searchParams.get('userId');

            if (userId) {
                this.connectedUsers.set(userId, ws);
                console.log(`User ${userId} connected to WebSocket`);

                // Send current unread count on connection
                this.sendUnreadCount(userId, 0); // Would get actual count from DB
            }

            ws.on('close', () => {
                if (userId) {
                    this.connectedUsers.delete(userId);
                    console.log(`User ${userId} disconnected from WebSocket`);
                }
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });

        console.log('✅ WebSocket server started');
    }

    async sendNotification(userId, notification) {
        const ws = this.connectedUsers.get(userId);

        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify({
                    type: 'NEW_NOTIFICATION',
                    notification
                }));
                return true;
            } catch (error) {
                console.error('Error sending WebSocket notification:', error);
                return false;
            }
        }

        return false;
    }

    async sendUnreadCount(userId, count) {
        const ws = this.connectedUsers.get(userId);

        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify({
                    type: 'UNREAD_COUNT_UPDATE',
                    count
                }));
                return true;
            } catch (error) {
                console.error('Error sending unread count:', error);
                return false;
            }
        }

        return false;
    }

    broadcastToUser(userId, message) {
        const ws = this.connectedUsers.get(userId);

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    broadcastToAll(message) {
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
}

const websocketService = new WebSocketService();

function setupWebSocket(server) {
    websocketService.setup(server);
}

module.exports = {
    setupWebSocket,
    default: websocketService
};