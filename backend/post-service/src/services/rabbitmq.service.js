const amqp = require('amqplib');

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.queues = {
            blogEvents: 'blog.events',
            notificationEvents: 'notification.events'
        };
    }

    async connect() {
        try {
            this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
            this.channel = await this.connection.createChannel();

            // Assert exchanges
            await this.channel.assertExchange('blog.events', 'topic', { durable: true });
            await this.channel.assertExchange('notification.events', 'topic', { durable: true });

            // Assert queues
            await this.channel.assertQueue(this.queues.blogEvents, { durable: true });
            await this.channel.assertQueue(this.queues.notificationEvents, { durable: true });

            // Bind queues to exchanges
            await this.channel.bindQueue(this.queues.blogEvents, 'blog.events', 'blog.#');

            console.log('✅ RabbitMQ connected for Post Service');
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

    async consume(queue, callback) {
        if (!this.channel) {
            console.error('RabbitMQ channel not available');
            return;
        }

        try {
            await this.channel.consume(queue, async (message) => {
                if (message) {
                    const content = JSON.parse(message.content.toString());
                    await callback(content);
                    this.channel.ack(message);
                }
            });
        } catch (error) {
            console.error('Error consuming from RabbitMQ:', error);
        }
    }
}

module.exports = new RabbitMQService();