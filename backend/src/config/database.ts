import mongoose from 'mongoose';
import config from './index';

import dns from 'dns';


// Force ipv4 to fix connection issues
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google Public DNS
dns.setDefaultResultOrder('ipv4first');

const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = config.mongo.url.endsWith('/')
      ? `${config.mongo.url}${config.mongo.dbName}`
      : `${config.mongo.url}/${config.mongo.dbName}`;

    await mongoose.connect(mongoUri, {
      // Connection pool sized for a small/growing app. ~20 concurrent sockets comfortably
      // serves the first several thousand users on a single API instance.
      maxPoolSize: 20,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 8000, // fail fast if the DB is unreachable
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB connected successfully to ${config.mongo.dbName}`);

    // Drop problematic Razorpay index if it exists (legacy)
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.collection('transactions').dropIndex('razorpayOrderId_1');
        console.log('✅ Dropped legacy Razorpay index');
      }
    } catch (e) {
      // Index likely doesn't exist, which is fine
    }
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

export default connectDatabase;
