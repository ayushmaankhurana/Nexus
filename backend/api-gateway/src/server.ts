import 'dotenv/config'; // <-- Always the very first line!
import { createApp } from './app';
import { loadConfig, logger } from '@nexus/core';
import { getPrismaClient } from './lib/prisma';

async function main() {
  const config = loadConfig();
  const app = await createApp();

  try {
    // 1. Start the server
    await app.listen({ port: config.port, host: '0.0.0.0' });
    logger.info(`Server listening on port ${config.port}`);

    // 2. Setup Graceful Shutdown Hooks (Inside main, where it can see 'app')
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

  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

main();