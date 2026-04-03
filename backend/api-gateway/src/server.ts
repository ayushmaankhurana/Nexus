import { createApp } from './app';
import { loadConfig, logger } from '@nexus/core';
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

main();