import { Router } from 'express';
import * as datasetsController from './datasets.controller';

const router = Router();

router.get('/', datasetsController.getAllDatasets);

export default router;