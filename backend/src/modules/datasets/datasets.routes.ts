import { Router } from 'express';
import * as datasetsController from './datasets.controller';

const router = Router();

router.get('/', datasetsController.getAllDatasets);
router.get('/:id', datasetsController.getDatasetById);

export default router;