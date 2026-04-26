
const mongoose = require('mongoose');
const mongoUrl = 'mongodb+srv://jhashivamuttpal_db_user:zSebDR7hQkaHdKqX@cluster0.qytqpum.mongodb.net/app_database';

console.log('Connecting to MongoDB...');
mongoose.connect(mongoUrl)
  .then(() => {
    console.log('Connected successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Connection failed:', err);
    process.exit(1);
  });

setTimeout(() => {
  console.error('Timeout after 10s');
  process.exit(1);
}, 10000);
