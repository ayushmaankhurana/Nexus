import { createApp } from './app';
import { loadConfig, logger } from '@nexus/core';
import { getPrismaClient } from './lib/prisma'; // Add this import at the top

// ... your existing server.listen() code ...


import 'dotenv/config';
async function main() {
  const config = loadConfig();
  const app = await createApp();

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    logger.info(`Server listening on port ${config.port}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}
// --- Graceful Shutdown Hooks ---
const signals = ['SIGINT', 'SIGTERM'];

signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    try {
      await app.close(); // Close Fastify
      await getPrismaClient().$disconnect(); // Close Prisma DB connections
      console.log('✅ Closed out remaining connections.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }
  });
});

main();