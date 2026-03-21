const amqp = require('amqplib');
const { logger } = require('../utils/logger');

let channel = null;

const connectRabbitMQ = async () => {
  try {
    const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    const connection = await amqp.connect(url);
    channel = await connection.createChannel();
    await channel.assertExchange('doctor_events', 'topic', { durable: true });
    logger.info('Doctor Service connected to RabbitMQ');
    console.log('🐰 Doctor Service connected to RabbitMQ');

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
    }
  } catch (error) {
    logger.error('Error publishing message:', error);
  }
};

module.exports = { connectRabbitMQ, publishMessage };
