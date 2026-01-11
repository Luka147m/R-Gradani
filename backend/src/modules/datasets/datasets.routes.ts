import { Router } from 'express';
import * as datasetsController from './datasets.controller';

const router = Router();

router.get('/', datasetsController.getAllDatasets);
router.get('/nedavno', datasetsController.getLatestDatasets);

router.get('/:id', datasetsController.getDatasetById);
router.post('/ids', datasetsController.getDatasetsByIds);
router.post('/search', datasetsController.searchDatasets);

router.get('/izdavaci/:id', datasetsController.getDatasetsByPublisher);
router.post('/izdavaci', datasetsController.getDatasetsByPublishers);

router.post('/filter', datasetsController.getDatasetsByTagsOrPublishers);

router.use('/:id/komentari', datasetsController.getCommentsByDatasetId);

router.post('/:id/refresh', datasetsController.refreshDatasetData);

export default router;