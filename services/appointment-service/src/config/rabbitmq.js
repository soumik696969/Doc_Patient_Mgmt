const amqp = require('amqplib');
const { logger } = require('../utils/logger');

let channel = null;

const connectRabbitMQ = async () => {
  try {
    const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    const connection = await amqp.connect(url);
    channel = await connection.createChannel();

    // Declare exchanges
    await channel.assertExchange('appointment_events', 'topic', { durable: true });
    await channel.assertExchange('notification_events', 'topic', { durable: true });

    logger.info('Appointment Service connected to RabbitMQ');
    console.log('🐰 Appointment Service connected to RabbitMQ');

    connection.on('error', (err) => logger.error('RabbitMQ error:', err));
    connection.on('close', () => {
      logger.warn('RabbitMQ closed. Reconnecting...');
      setTimeout(connectRabbitMQ, 5000);
    });
  } catch (error) {
    logger.error('RabbitMQ connection error:', error);
    console.log('⚠️ RabbitMQ not available. Running without message broker.');
  }
};

const publishMessage = async (exchange, routingKey, message) => {
  try {
    if (channel) {
      channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), { persistent: true });
      logger.info(`Published to ${exchange}: ${routingKey}`);
    }
  } catch (error) {
    logger.error('Error publishing message:', error);
  }
};

const getChannel = () => channel;

module.exports = { connectRabbitMQ, publishMessage, getChannel };
