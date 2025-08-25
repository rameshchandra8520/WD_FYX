import { getCities, addCity, removeCity } from '../services/citiesService.js';

export async function listCitiesController(req, res) {
  try {
    const cities = await getCities();
    res.json({ cities });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to list cities' });
  }
}

export async function addCityController(req, res) {
  const city = (req.body?.city || '').trim();
  if (!city) return res.status(400).json({ error: 'city is required in body' });
  try {
    const result = await addCity(city);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to add city' });
  }
}

export async function removeCityController(req, res) {
  const city = (req.params?.city || '').trim();
  if (!city) return res.status(400).json({ error: 'city param is required' });
  try {
    await removeCity(city);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to remove city' });
  }
}



