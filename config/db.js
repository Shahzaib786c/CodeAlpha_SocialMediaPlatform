const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI from the environment.
 * Exits the process if the connection fails, because the API
 * is useless without a database.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
