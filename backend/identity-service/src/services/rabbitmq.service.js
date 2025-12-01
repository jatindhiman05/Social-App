const amqp = require('amqplib');

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
    }

    async connect() {
        try {
            this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
            this.channel = await this.connection.createChannel();

            // Assert exchanges
            await this.channel.assertExchange('user.events', 'topic', { durable: true });
            await this.channel.assertExchange('email.events', 'topic', { durable: true });

            console.log('✅ RabbitMQ connected for Identity Service');
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
}

module.exports = new RabbitMQService();