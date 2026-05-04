import dotenv from 'dotenv';

import app from './app.js';
import connectToDatabase from './config/db.js';
import { seedDemoUser } from './services/demoSeedService.js';
dotenv.config();

const port = Number(process.env.PORT) || 4000;

const startServer = async () => {
  await connectToDatabase(process.env.MONGODB_URI);

  if (process.env.ENABLE_DEMO_SEED === 'true') {
    await seedDemoUser();
  }



  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
