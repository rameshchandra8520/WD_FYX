import { WeatherCache } from '../models/WeatherCache.js';
import mongoose from 'mongoose';

const inMemoryCache = new Map();

export async function getCachedWeather(key) {
  // Check in-memory first
  const mem = inMemoryCache.get(key);
  if (mem && mem.expiresAt > Date.now()) {
    return mem.value;
  }

  // Check MongoDB cache
  if (mongoose.connection.readyState === 1) {
    const doc = await WeatherCache.findOne({ key }).lean();
    if (doc && doc.expiresAt.getTime() > Date.now()) {
      // hydrate memory for faster subsequent lookups
      inMemoryCache.set(key, { value: doc.value, expiresAt: doc.expiresAt.getTime() });
      return doc.value;
    }
  }
  return null;
}

export async function setCachedWeather(key, value, ttlSeconds) {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  inMemoryCache.set(key, { value, expiresAt: expiresAt.getTime() });
  if (mongoose.connection.readyState === 1) {
    await WeatherCache.findOneAndUpdate(
      { key },
      { key, value, expiresAt },
      { upsert: true, new: true }
    );
  }
}


