import dotenv from 'dotenv';

import app from './app.js';
import connectToDatabase from './config/db.js';
import { ensureDemoData } from './services/demoSeedService.js';
import { runDailyYield } from './services/yieldService.js';

dotenv.config();

const port = Number(process.env.PORT) || 4000;
const YIELD_SYNC_INTERVAL_MS = 60 * 60 * 1000;

const syncDailyYield = async () => {
  try {
    await runDailyYield();
  } catch (error) {
    console.error('Daily yield sync failed', error);
  }
};

const startServer = async () => {
  await connectToDatabase(process.env.MONGODB_URI);
  await ensureDemoData();
  await syncDailyYield();
  setInterval(syncDailyYield, YIELD_SYNC_INTERVAL_MS);

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
