import { Router } from 'express';
import * as datasetsController from './datasets.controller';

const router = Router();

router.get('/', datasetsController.getAllDatasets);
router.get('/nedavno', datasetsController.getLatestDatasets);

router.get('/:id', datasetsController.getDatasetById);
router.post('/ids', datasetsController.getDatasetsByIds);

router.get('/izdavaci/:id', datasetsController.getDatasetsByPublisher);
router.post('/izdavaci', datasetsController.getDatasetsByPublishers);

router.post('/filter', datasetsController.getDatasetsByTagsOrPublishers);


// Promjena - potrebno update openapi specifikaciju
// Pomaknuto da ne koristi kontroler iz comments modula, nego iz datasets modula radi konflikta
router.use('/:id/komentari', datasetsController.getCommentsByDatasetId);

export default router;