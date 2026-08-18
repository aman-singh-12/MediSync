const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URI || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Connected'));

// Connect asynchronously (we do not await here to not block server startup completely if redis fails, but it is generally recommended to await connect() before use)
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis on startup', err);
  }
})();

module.exports = redisClient;
