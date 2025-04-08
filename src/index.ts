import express, { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors'; // Import the CORS middleware
import { userRouter } from './routes/userRoutes';

const app = express();
const port = process.env.PORT || 3000;

// MongoDB URI and Database
const uri = 'mongodb://localhost:27017';
const dbName = 'restopilot';

let db: any;

// Middleware to handle CORS
app.use(cors()); // Enable CORS for all routes

// Middleware to parse JSON requests
app.use(express.json()); // for parsing application/json

// MongoDB Connection
async function connectToDatabase() {
  try {
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
  app.use('/api/v1/users', userRouter(db)); // v1 added as the prefix for the 'users' route

  app.get('/', (req: Request, res: Response) => {
    res.send('Hello, World!');
  });

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});
