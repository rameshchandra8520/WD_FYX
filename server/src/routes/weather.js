import { Router } from 'express';
import { getCurrentWeatherController, getForecastController } from '../controllers/weatherController.js';

const router = Router();

router.get('/current', getCurrentWeatherController);
router.get('/forecast', getForecastController);

export default router;



