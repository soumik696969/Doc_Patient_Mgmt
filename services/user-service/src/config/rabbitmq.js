const amqp = require('amqplib');
const { logger } = require('../utils/logger');

let channel = null;
let connection = null;

const connectRabbitMQ = async () => {
  try {
    const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    connection = await amqp.connect(url);
    channel = await connection.createChannel();
    
    // Declare exchanges
    await channel.assertExchange('user_events', 'topic', { durable: true });
    
    logger.info('User Service connected to RabbitMQ');
    console.log('🐰 User Service connected to RabbitMQ');

    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error:', err);
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed. Reconnecting...');
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
      logger.info(`Message published to ${exchange} with key ${routingKey}`);
    }
  } catch (error) {
    logger.error('Error publishing message:', error);
  }
};

const getChannel = () => channel;

module.exports = { connectRabbitMQ, publishMessage, getChannel };
