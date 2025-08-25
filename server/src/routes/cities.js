import { Router } from 'express';
import { listCitiesController, addCityController, removeCityController } from '../controllers/citiesController.js';

const router = Router();

router.get('/', listCitiesController);
router.post('/', addCityController);
router.delete('/:city', removeCityController);

export default router;



