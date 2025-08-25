import { fetchCurrentWeather, fetchForecastWeather } from '../services/weatherService.js';

export async function getCurrentWeatherController(req, res) {
  const city = (req.query.city || '').trim();
  if (!city) return res.status(400).json({ error: 'city query param is required' });
  try {
    const data = await fetchCurrentWeather(city);
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.message || 'Failed to fetch current weather' });
  }
}

export async function getForecastController(req, res) {
  const city = (req.query.city || '').trim();
  if (!city) return res.status(400).json({ error: 'city query param is required' });
  try {
    const data = await fetchForecastWeather(city);
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.message || 'Failed to fetch forecast' });
  }
}



