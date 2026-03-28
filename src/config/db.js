const mongoose = require('mongoose');

// Maintains separate connections per service to support different DBs
const connections = {};

const connectDB = async (name, uri) => {
  if (connections[name]) return connections[name];

  try {
    const conn = await mongoose.createConnection(uri);
    connections[name] = conn;
    console.log(`[DB] ${name} connected`);
    return conn;
  } catch (err) {
    console.error(`[DB] ${name} connection failed:`, err.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
