import mongoose from 'mongoose';

const connectToDatabase = async (mongoUri) => {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required.');
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000
  });
};

export default connectToDatabase;
