const amqp = require('amqplib');
const { logger } = require('../utils/logger');
const { handleNotificationEvent } = require('../handlers/notificationHandler');

let channel = null;

const connectRabbitMQ = async () => {
  try {
    const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    const connection = await amqp.connect(url);
    channel = await connection.createChannel();

    // Declare exchanges
    await channel.assertExchange('notification_events', 'topic', { durable: true });
    await channel.assertExchange('user_events', 'topic', { durable: true });
    await channel.assertExchange('appointment_events', 'topic', { durable: true });

    // Create queue for this service
    const q = await channel.assertQueue('notification_queue', { durable: true });

    // Bind to relevant events
    await channel.bindQueue(q.queue, 'notification_events', 'appointment.*');
    await channel.bindQueue(q.queue, 'user_events', 'user.registered');
    await channel.bindQueue(q.queue, 'appointment_events', 'appointment.*');

    // Consume messages
    channel.consume(q.queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          const routingKey = msg.fields.routingKey;
          
          logger.info(`Received event: ${routingKey}`, content);
          await handleNotificationEvent(routingKey, content);
          
          channel.ack(msg);
        } catch (error) {
          logger.error('Error processing message:', error);
          channel.nack(msg, false, false); // Don't requeue failed messages
        }
      }
    });

    logger.info('Notification Service connected to RabbitMQ and consuming events');
    console.log('🐰 Notification Service connected to RabbitMQ - Listening for events...');

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

module.exports = { connectRabbitMQ };
