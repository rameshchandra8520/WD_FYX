import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const formatIconUrl = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`;
const CACHE_PREFIX = 'weather-cache:';
const TEN_MIN_MS = 10 * 60 * 1000;

function getCache(city) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + city.toLowerCase());
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCache(city, payload) {
  try {
    localStorage.setItem(CACHE_PREFIX + city.toLowerCase(), JSON.stringify(payload));
  } catch {}
}

function toTitleCase(name) {
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function App() {
  const [cities, setCities] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weatherData, setWeatherData] = useState({});
  const [toast, setToast] = useState(/** @type {{ message: string, variant: 'success'|'error'|'info' }|''} */(''));
  const [confirmCity, setConfirmCity] = useState('');

  useEffect(() => {
    axios.get('/api/cities').then(r => setCities(r.data.cities || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!cities.length) return;
    setLoading(true);
    setError('');

    Promise.all(
      cities.map(async (city) => {
        const cached = getCache(city);
        const now = Date.now();
        if (cached && now - cached.timestamp < TEN_MIN_MS) {
          return [city, cached.data];
        }
        try {
          const [current, forecast] = await Promise.all([
            axios.get('/api/weather/current', { params: { city } }),
            axios.get('/api/weather/forecast', { params: { city } }),
          ]);
          const combined = { current: current.data, forecast: forecast.data, timestamp: now };
          setCache(city, { data: combined, timestamp: now });
          return [city, combined];
        } catch (e) {
          if (cached) {
            return [city, cached.data];
          }
          return [city, { error: e.response?.data?.error || 'Failed to load' }];
        }
      })
    )
      .then((pairs) => setWeatherData(Object.fromEntries(pairs)))
      .catch(() => setError('Failed to load weather'))
      .finally(() => setLoading(false));
  }, [cities]);

  const onAddCity = async (e) => {
    e.preventDefault();
    const raw = query.trim();
    if (!raw) return setError('Please enter a city name');
    const city = toTitleCase(raw);
    setError('');
    try {
      await axios.get('/api/weather/current', { params: { city } });
    } catch (err) {
      if (err.response?.status === 404) {
        showToast('City not found, please try again.', 'error');
        return;
      }
      showToast(err.response?.data?.error || 'Failed to validate city', 'error');
      return;
    }
    try {
      const res = await axios.post('/api/cities', { city });
      setCities(res.data.cities || []);
      setQuery('');
      showToast('City added successfully.', 'success');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add city');
      showToast('Failed to add city.', 'error');
    }
  };

  const showToast = (message, variant = 'info') => {
    setToast({ message, variant });
    setTimeout(() => setToast(''), 3000);
  };

  const onRemoveCity = (city) => {
    setConfirmCity(city);
  };

  const confirmRemove = async () => {
    const city = confirmCity;
    setConfirmCity('');
    try {
      await axios.delete(`/api/cities/${encodeURIComponent(city)}`);
      setCities((prev) => prev.filter((c) => c !== city));
      showToast('City removed.', 'error');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove city');
      showToast('Failed to remove city.', 'error');
    }
  };

  const cancelRemove = () => setConfirmCity('');

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <h1>🌤️ Weather Dashboard</h1>
          <p className="header-subtitle">Track weather conditions across multiple cities</p>
        </div>
        <form className="search" onSubmit={onAddCity}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Add a city (e.g. London, Tokyo, New York)"
            aria-label="City name"
          />
          <button type="submit">
            <span>Add City</span>
          </button>
        </form>
      </header>

      {toast && (
        <div className={`toast ${toast.variant === 'success' ? 'toast-success' : toast.variant === 'error' ? 'toast-error' : ''}`}>
          {toast.message}
        </div>
      )}

      {error && (
        <div className="error">
          <span>⚠️ {error}</span>
        </div>
      )}
      
      {loading && (
        <div className="loading">
          <span>⏳ Loading weather data...</span>
        </div>
      )}

      <div className="grid">
        {cities.map((city) => (
          <CityCard
            key={city}
            city={city}
            data={weatherData[city]}
            onRemove={() => onRemoveCity(city)}
          />
        ))}
        {!cities.length && (
          <div className="empty">
            <div className="empty-content">
              <span className="empty-icon">🌍</span>
              <h3>No cities added yet</h3>
              <p>Add your first city above to start tracking weather conditions</p>
            </div>
          </div>
        )}
      </div>

      {confirmCity && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Confirm remove city">
          <div className="modal">
            <div className="modal-title">Remove City</div>
            <div className="modal-body">Are you sure you want to remove this city?</div>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={confirmRemove}>Yes</button>
              <button className="btn" onClick={cancelRemove}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CityCard({ city, data, onRemove }) {
  const current = data?.current;
  const forecast = data?.forecast;
  const err = data?.error;
  const timestamp = data?.timestamp || null;

  const displayCity = toTitleCase(city);

  const sunriseStr = formatLocalTime(current?.sunrise, current?.timezone);
  const sunsetStr = formatLocalTime(current?.sunset, current?.timezone);
  const aqi = current?.airQuality?.index ?? null;
  const aqiText = current?.airQuality?.text ?? 'AQI unavailable';

  const lastUpdated = timestamp ? timeAgo(timestamp) : '';

  return (
    <div className="card">
      <div className="card-header">
        <div className="city-info">
          <h2>{displayCity}</h2>
          {lastUpdated && (
            <span className="last-updated">Last updated {lastUpdated}</span>
          )}
        </div>
        <button className="remove" onClick={onRemove} aria-label={`Remove ${displayCity}`}>
          ×
        </button>
      </div>
      
      {err && (
        <div className="error small">
          <span>⚠️ {err}</span>
        </div>
      )}
      
      {current && (
        <div className="current">
          <div className="weather-icon">
            <img src={formatIconUrl(current.icon)} alt={current.description} />
          </div>
          <div className="weather-info">
            <div className="temp">{Math.round(current.temperature)}°C</div>
            <div className="desc">{current.description}</div>
            <div className="details">
              <span>Humidity: {current.humidity}%</span>
              <span>Wind: {current.windSpeed} km/h</span>
            </div>
          </div>
        </div>
      )}

      {current && (
        <div className="info-cards">
          <div className="info-card">
            <div className="info-card-title">Sunrise & Sunset</div>
            <div className="info-row"><span>🌅 Sunrise</span><span>{sunriseStr || '—'}</span></div>
            <div className="info-row"><span>🌇 Sunset</span><span>{sunsetStr || '—'}</span></div>
          </div>
          <div className="info-card">
            <div className="info-card-title">Air Quality</div>
            <div className={`aqi-badge aqi-${aqi ?? 'na'}`}>
              {aqi ? `AQI ${aqi} • ${aqiText}` : aqiText}
            </div>
          </div>
        </div>
      )}
      
      {forecast?.days && (
        <div className="forecast-section">
          <h3 className="forecast-title">5-Day Forecast</h3>
          <div className="forecast">
            {forecast.days.map((d) => (
              <div key={d.date} className="day">
                <div className="date">{formatDate(d.date)}</div>
                <img src={formatIconUrl(d.icon)} alt={d.description} />
                <div className="temp">{Math.round(d.temperature)}°C</div>
                <div className="desc">{d.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatLocalTime(unixSeconds, tzOffsetSeconds) {
  if (!unixSeconds || typeof tzOffsetSeconds !== 'number') return '';
  const utcMillis = unixSeconds * 1000;
  const localMillis = utcMillis + tzOffsetSeconds * 1000;
  const d = new Date(localMillis);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

function timeAgo(timestamp) {
  const diffMs = Date.now() - timestamp;
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 minute ago';
  return `${mins} minutes ago`;
}

export default App
