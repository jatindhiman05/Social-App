const amqp = require('amqplib');
const commentService = require('./comment.service');

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.queues = {
            commentEvents: 'comment.events',
            blogEvents: 'blog.events',
            notificationEvents: 'notification.events'
        };
    }

    async connect() {
        try {
            this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
            this.channel = await this.connection.createChannel();

            // Assert exchanges
            await this.channel.assertExchange('comment.events', 'topic', { durable: true });
            await this.channel.assertExchange('blog.events', 'topic', { durable: true });
            await this.channel.assertExchange('notification.events', 'topic', { durable: true });

            // Assert queues
            await this.channel.assertQueue(this.queues.commentEvents, { durable: true });
            await this.channel.assertQueue(this.queues.blogEvents, { durable: true });

            // Bind queues to exchanges
            await this.channel.bindQueue(this.queues.commentEvents, 'comment.events', 'comment.#');
            await this.channel.bindQueue(this.queues.blogEvents, 'blog.events', 'blog.#');

            console.log('✅ RabbitMQ connected for Comment Service');
        } catch (error) {
            console.error('❌ RabbitMQ connection error:', error);
            setTimeout(() => this.connect(), 5000);
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

    async consumeCommentEvents() {
        if (!this.channel) {
            console.error('RabbitMQ channel not available');
            return;
        }

        try {
            await this.channel.consume(this.queues.blogEvents, async (message) => {
                if (message) {
                    const content = JSON.parse(message.content.toString());

                    switch (content.type) {
                        case 'BLOG_DELETED':
                            await commentService.deleteCommentsByBlog(content.blogId);
                            break;
                        case 'USER_DELETED':
                            await commentService.deleteCommentsByUser(content.userId);
                            break;
                    }

                    this.channel.ack(message);
                }
            });
        } catch (error) {
            console.error('Error consuming from RabbitMQ:', error);
        }
    }

    async publishNotification(event) {
        await this.publish('notification.events', event, 'notification.comment');
    }
}

module.exports = new RabbitMQService();