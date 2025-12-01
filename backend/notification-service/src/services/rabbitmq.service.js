const amqp = require('amqplib');
const notificationService = require('./notification.service');
const websocketService = require('./websocket.service');

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.queues = {
            notificationEvents: 'notification.events'
        };
    }

    async connect() {
        try {
            this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
            this.channel = await this.connection.createChannel();

            // Assert exchange
            await this.channel.assertExchange('notification.events', 'topic', { durable: true });

            // Assert queue
            await this.channel.assertQueue(this.queues.notificationEvents, { durable: true });

            // Bind queue to exchange for all notification events
            await this.channel.bindQueue(this.queues.notificationEvents, 'notification.events', '#');

            console.log('✅ RabbitMQ connected for Notification Service');
        } catch (error) {
            console.error('❌ RabbitMQ connection error:', error);
            setTimeout(() => this.connect(), 5000);
        }
    }

    async consumeNotificationEvents() {
        if (!this.channel) {
            console.error('RabbitMQ channel not available');
            return;
        }

        try {
            await this.channel.consume(this.queues.notificationEvents, async (message) => {
                if (message) {
                    const event = JSON.parse(message.content.toString());
                    await this.handleNotificationEvent(event);
                    this.channel.ack(message);
                }
            });
        } catch (error) {
            console.error('Error consuming from RabbitMQ:', error);
        }
    }

    async handleNotificationEvent(event) {
        try {
            switch (event.type) {
                case 'BLOG_LIKED':
                    await notificationService.handleBlogLiked(event);
                    break;
                case 'COMMENT_ADDED':
                    await notificationService.handleCommentAdded(event);
                    break;
                case 'COMMENT_LIKED':
                    await notificationService.handleCommentLiked(event);
                    break;
                case 'REPLY_ADDED':
                    await notificationService.handleReplyAdded(event);
                    break;
                case 'USER_FOLLOWED':
                    await notificationService.handleUserFollowed(event);
                    break;
                case 'BLOG_CREATED':
                    await notificationService.handleBlogCreated(event);
                    break;
                case 'BLOG_UPDATED':
                    await notificationService.handleBlogUpdated(event);
                    break;
                default:
                    console.log('Unknown notification event type:', event.type);
            }
        } catch (error) {
            console.error('Error handling notification event:', error);
        }
    }

    async publish(exchange, message, routingKey = '') {
        if (!this.channel) {
            console.error('RabbitMQ channel not available');
            return;
        }

        try {
            this.channel.publish(
                exchange,
                routingKey,
                Buffer.from(JSON.stringify(message)),
                { persistent: true }
            );
        } catch (error) {
            console.error('Error publishing to RabbitMQ:', error);
        }
    }
}

module.exports = new RabbitMQService();