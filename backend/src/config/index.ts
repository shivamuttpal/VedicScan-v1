import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface Config {
  env: string;
  port: number;
  mongo: {
    url: string;
    dbName: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  openai: {
    apiKey: string;
    assistantId: string;
    model: string;
  };
  mail: {
    user: string;
    pass: string;
  };
  aws: {
    accessKey: string;
    secretKey: string;
    region: string;
    sourceEmail: string;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8001', 10),
  mongo: {
    url: process.env.MONGO_URL || 'mongodb://localhost:27017',
    dbName: process.env.DB_NAME || 'app_database',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    assistantId: process.env.OPENAI_ASSISTANT_ID || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  mail: {
    user: process.env.GMAIL_USER || '',
    pass: process.env.GMAIL_PASS || '',
  },
  aws: {
    accessKey: process.env.AWS_ACCESS_KEY || '',
    secretKey: process.env.AWS_SECRET_KEY || '',
    region: process.env.AWS_REGION || 'ap-south-1',
    sourceEmail: process.env.AWS_SES_SOURCE_EMAIL || process.env.GMAIL_USER || '',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
};

export default config;
