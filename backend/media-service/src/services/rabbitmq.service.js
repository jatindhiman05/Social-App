const amqp = require('amqplib');
const cloudinaryService = require('./cloudinary.service');

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.queues = {
            mediaEvents: 'media.events'
        };
    }

    async connect() {
        try {
            this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
            this.channel = await this.connection.createChannel();

            // Assert exchange
            await this.channel.assertExchange('media.events', 'topic', { durable: true });

            // Assert queue
            await this.channel.assertQueue(this.queues.mediaEvents, { durable: true });

            // Bind queue to exchange
            await this.channel.bindQueue(this.queues.mediaEvents, 'media.events', '#');

            console.log('✅ RabbitMQ connected for Media Service');
        } catch (error) {
            console.error('❌ RabbitMQ connection error:', error);
            setTimeout(() => this.connect(), 5000);
        }
    }

    async consumeMediaEvents() {
        if (!this.channel) {
            console.error('RabbitMQ channel not available');
            return;
        }

        try {
            await this.channel.consume(this.queues.mediaEvents, async (message) => {
                if (message) {
                    const event = JSON.parse(message.content.toString());
                    await this.handleMediaEvent(event);
                    this.channel.ack(message);
                }
            });
        } catch (error) {
            console.error('Error consuming from RabbitMQ:', error);
        }
    }

    async handleMediaEvent(event) {
        try {
            switch (event.type) {
                case 'DELETE_IMAGES':
                    await cloudinaryService.deleteMultipleImages(event.imageIds);
                    break;
                case 'UPLOAD_IMAGES':
                    // Handle batch image uploads
                    break;
            }
        } catch (error) {
            console.error('Error handling media event:', error);
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