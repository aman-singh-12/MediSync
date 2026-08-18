const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URI || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Connected'));

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis on startup', err);
    throw err;
  }
};

module.exports = { redisClient, connectRedis };
