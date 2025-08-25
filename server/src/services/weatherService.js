import axios from 'axios';
import dotenv from 'dotenv';
import { getCachedWeather, setCachedWeather } from './weatherCache.js';

dotenv.config();

const API_KEY = process.env.OPENWEATHER_API_KEY || '';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Validate API key
if (!API_KEY || API_KEY === 'REPLACE_WITH_YOUR_KEY') {
  throw new Error('OpenWeatherMap API key is missing or invalid. Please set OPENWEATHER_API_KEY in your .env file.');
}

function buildWeatherUrl(endpoint, params) {
  const usp = new URLSearchParams({ ...params, appid: API_KEY, units: 'metric' });
  return `${BASE_URL}/${endpoint}?${usp.toString()}`;
}

function buildAirUrl(lat, lon) {
  const usp = new URLSearchParams({ lat: String(lat), lon: String(lon), appid: API_KEY });
  return `${BASE_URL}/air_pollution?${usp.toString()}`;
}

function mapAqiToText(aqi) {
  switch (aqi) {
    case 1: return 'Good';
    case 2: return 'Fair';
    case 3: return 'Moderate';
    case 4: return 'Poor';
    case 5: return 'Very Poor';
    default: return 'Unknown';
  }
}

async function fetchAirQuality(lat, lon) {
  const url = buildAirUrl(lat, lon);
  const { data } = await axios.get(url, { timeout: 10000 });
  const aqi = data?.list?.[0]?.main?.aqi ?? null;
  return aqi ? { index: aqi, text: mapAqiToText(aqi) } : null;
}

export async function fetchCurrentWeather(city) {
  const cacheKey = `current:${city.toLowerCase()}`;
  const cached = await getCachedWeather(cacheKey);
  if (cached) return cached;

  const url = buildWeatherUrl('weather', { q: city });
  try {
    const { data } = await axios.get(url, { timeout: 10000 });

    // Try to fetch AQI using coordinates from current weather
    let airQuality = null;
    try {
      if (data?.coord?.lat != null && data?.coord?.lon != null) {
        airQuality = await fetchAirQuality(data.coord.lat, data.coord.lon);
      }
    } catch (_) {
      // Graceful fallback: leave airQuality as null
    }

    const normalized = normalizeCurrentWeather(data, airQuality);
    await setCachedWeather(cacheKey, normalized, 10 * 60); // 10 minutes
    return normalized;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid OpenWeatherMap API key. Please check your .env file.');
    }
    if (error.response?.status === 404) {
      throw new Error(`City "${city}" not found. Please check the spelling.`);
    }
    throw error;
  }
}

export async function fetchForecastWeather(city) {
  const cacheKey = `forecast:${city.toLowerCase()}`;
  const cached = await getCachedWeather(cacheKey);
  if (cached) return cached;

  const url = buildWeatherUrl('forecast', { q: city });
  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    const normalized = normalizeForecast(data);
    await setCachedWeather(cacheKey, normalized, 30 * 60); // 30 minutes
    return normalized;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid OpenWeatherMap API key. Please check your .env file.');
    }
    if (error.response?.status === 404) {
      throw new Error(`City "${city}" not found. Please check the spelling.`);
    }
    throw error;
  }
}

function normalizeCurrentWeather(data, airQuality) {
  return {
    city: `${data.name}, ${data.sys?.country ?? ''}`.trim(),
    coord: data.coord,
    temperature: Math.round(data.main.temp),
    description: data.weather?.[0]?.description ?? 'n/a',
    icon: data.weather?.[0]?.icon ?? '01d',
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    dt: data.dt,
    // New fields
    sunrise: data.sys?.sunrise ?? null,
    sunset: data.sys?.sunset ?? null,
    timezone: data.timezone ?? 0, // seconds offset from UTC
    airQuality: airQuality || null,
  };
}

function normalizeForecast(data) {
  // Group by date (5 days) selecting midday entries when possible
  const byDate = new Map();
  for (const entry of data.list) {
    const date = entry.dt_txt.split(' ')[0];
    const hour = entry.dt_txt.split(' ')[1].split(':')[0];
    const isNoon = hour === '12';
    if (!byDate.has(date) || isNoon) {
      byDate.set(date, entry);
    }
  }
  const days = Array.from(byDate.entries()).slice(0, 5).map(([date, e]) => ({
    date,
    temperature: Math.round(e.main.temp),
    description: e.weather?.[0]?.description ?? 'n/a',
    icon: e.weather?.[0]?.icon ?? '01d',
  }));
  return { city: `${data.city.name}, ${data.city.country}`, days };
}



