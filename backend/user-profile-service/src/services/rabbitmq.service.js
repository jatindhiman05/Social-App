const amqp = require('amqplib');
const userService = require('./user.service');

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.queues = {
            userEvents: 'user.events',
            blogEvents: 'blog.events',
            notificationEvents: 'notification.events'
        };
    }

    async connect() {
        try {
            this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
            this.channel = await this.connection.createChannel();

            // Assert exchanges
            await this.channel.assertExchange('user.events', 'topic', { durable: true });
            await this.channel.assertExchange('blog.events', 'topic', { durable: true });
            await this.channel.assertExchange('notification.events', 'topic', { durable: true });

            // Assert queues
            await this.channel.assertQueue(this.queues.userEvents, { durable: true });
            await this.channel.assertQueue(this.queues.blogEvents, { durable: true });

            // Bind queues to exchanges
            await this.channel.bindQueue(this.queues.userEvents, 'user.events', 'user.#');
            await this.channel.bindQueue(this.queues.blogEvents, 'blog.events', 'blog.#');

            console.log('✅ RabbitMQ connected for User Profile Service');
        } catch (error) {
            console.error('❌ RabbitMQ connection error:', error);
            setTimeout(() => this.connect(), 5000);
        }
    }

    async consumeUserEvents() {
        if (!this.channel) {
            console.error('RabbitMQ channel not available');
            return;
        }

        try {
            await this.channel.consume(this.queues.userEvents, async (message) => {
                if (message) {
                    const event = JSON.parse(message.content.toString());
                    await this.handleUserEvent(event);
                    this.channel.ack(message);
                }
            });
        } catch (error) {
            console.error('Error consuming from RabbitMQ:', error);
        }
    }

    async consumeBlogEvents() {
        if (!this.channel) {
            console.error('RabbitMQ channel not available');
            return;
        }

        try {
            await this.channel.consume(this.queues.blogEvents, async (message) => {
                if (message) {
                    const event = JSON.parse(message.content.toString());
                    await this.handleBlogEvent(event);
                    this.channel.ack(message);
                }
            });
        } catch (error) {
            console.error('Error consuming from RabbitMQ:', error);
        }
    }

    async handleUserEvent(event) {
        try {
            switch (event.type) {
                case 'USER_CREATED':
                    await userService.createProfileFromEvent(event);
                    break;
                case 'USER_VERIFIED':
                    await userService.updateUserVerification(event.userId, true);
                    break;
                case 'USER_DELETED':
                    await userService.deleteProfile(event.userId);
                    break;
                case 'GET_USER_INFO':
                    // Respond with user info (would need request-response pattern)
                    break;
            }
        } catch (error) {
            console.error('Error handling user event:', error);
        }
    }

    async handleBlogEvent(event) {
        try {
            switch (event.type) {
                case 'BLOG_CREATED_FOR_USER':
                    await userService.addBlogToUser(event.userId, event.blogId);
                    break;
                case 'BLOG_DELETED':
                    await userService.removeBlogFromUser(event.userId, event.blogId);
                    break;
                case 'BLOG_LIKED':
                    await userService.addLikedBlog(event.userId, event.blogId);
                    break;
                case 'BLOG_UNLIKED':
                    await userService.removeLikedBlog(event.userId, event.blogId);
                    break;
                case 'BLOG_SAVED':
                    await userService.addSavedBlog(event.userId, event.blogId);
                    break;
                case 'BLOG_UNSAVED':
                    await userService.removeSavedBlog(event.userId, event.blogId);
                    break;
            }
        } catch (error) {
            console.error('Error handling blog event:', error);
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

    async publishNotification(event) {
        await this.publish('notification.events', event, 'notification.user');
    }
}

module.exports = new RabbitMQService();