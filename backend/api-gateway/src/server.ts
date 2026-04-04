import 'dotenv/config'; // Sabse pehle environment load karo
import { createApp } from './app';
import { loadConfig, logger } from '@nexus/core';
import { getPrismaClient } from './lib/prisma';

async function main() {
  // 1. Config load karo
  const config = loadConfig();

  // 2. LoadConfig se mila hua 'config' yahan pass karo
  const app = await createApp(config);

  try {
    // 3. Port setup
    const port = config.port || 8080;
    
    await app.listen({ port: port, host: '0.0.0.0' });
    
    // Colorful log for victory!
    console.log(`\n🚀 ==========================================`);
    console.log(`   NEXUS API GATEWAY IS LIVE ON PORT ${port}`);
    console.log(`   ==========================================\n`);

    // --- RESTORED GRACEFUL SHUTDOWN HOOKS (DO NOT DELETE) ---
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
    logger.error('❌ Server failed to start:');
    logger.error(err);
    process.exit(1);
  }
}

main();