import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors'; // Import the CORS middleware
import { restaurantRouter } from './routes/restaurantRoutes.js';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

// MongoDB URI and Database (from environment)
const uri = process.env.MONGODB_URI || '';
const dbName = process.env.DB_NAME || 'restopilot';

let db;

// Middleware to handle CORS
app.use(cors()); // Enable CORS for all routes

// Middleware to parse JSON requests
app.use(express.json()); // for parsing application/json

// MongoDB Connection
async function connectToDatabase() {
  try {
    if (!uri) {
      throw new Error('MONGODB_URI is not set in environment');
    }

    const client = await MongoClient.connect(uri);
    console.log('MongoDB connected');
    db = client.db(dbName); // Set the db connection
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process if DB connection fails
  }
}

connectToDatabase().then(() => {
  // Add v1 prefix to all API routes
  app.use('/api/v1/users', restaurantRouter(db)); // v1 added as the prefix for the 'users' route

  app.get('/', (req, res) => {
    res.send('Hello, World!');
  });

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});
