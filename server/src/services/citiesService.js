import { UserPrefs } from '../models/UserPrefs.js';
import mongoose from 'mongoose';

const DEFAULT_USER_ID = 'default';

export async function getCities(userId = DEFAULT_USER_ID) {
  if (mongoose.connection.readyState === 1) {
    const doc = await UserPrefs.findOne({ userId }).lean();
    return doc?.cities ?? [];
  }
  // fallback to in-memory within process
  global.__CITIES__ = global.__CITIES__ || [];
  return global.__CITIES__;
}

export async function addCity(city, userId = DEFAULT_USER_ID) {
  const normalized = city.trim();
  if (!normalized) throw new Error('city required');
  if (mongoose.connection.readyState === 1) {
    const doc = await UserPrefs.findOneAndUpdate(
      { userId },
      { $addToSet: { cities: normalized } },
      { upsert: true, new: true }
    ).lean();
    return { cities: doc.cities };
  }
  global.__CITIES__ = Array.from(new Set([...(global.__CITIES__ || []), normalized]));
  return { cities: global.__CITIES__ };
}

export async function removeCity(city, userId = DEFAULT_USER_ID) {
  const normalized = city.trim();
  if (!normalized) throw new Error('city required');
  if (mongoose.connection.readyState === 1) {
    await UserPrefs.findOneAndUpdate(
      { userId },
      { $pull: { cities: normalized } },
      { new: true }
    ).lean();
    return;
  }
  global.__CITIES__ = (global.__CITIES__ || []).filter((c) => c !== normalized);
}


