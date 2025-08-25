import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import weatherRouter from './routes/weather.js';
import citiesRouter from './routes/cities.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/weather', weatherRouter);
app.use('/api/cities', citiesRouter);
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' });
});

// Static client build
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Catch-all to serve index.html for non-API routes (Express 5-safe regex)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/weather_dashboard';

async function start() {
  try {
    mongoose.set('bufferCommands', false);
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.warn('MongoDB connection failed. Continuing with in-memory fallback. Error:', err.message);
  }

  app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
}

start();


