import { Router } from 'express';
import * as datasetsController from './datasets.controller';
import commentsRouter from '../comments/comments.routes';

const router = Router();

router.get('/', datasetsController.getAllDatasets);
router.get('/nedavno', datasetsController.getLatestDatasets);

router.get('/:id', datasetsController.getDatasetById);
router.post('/ids', datasetsController.getDatasetsByIds);

router.get('/izdavaci/:id', datasetsController.getDatasetsByPublisher);
router.post('/izdavaci', datasetsController.getDatasetsByPublishers);

router.post('/filter', datasetsController.getDatasetsByTagsOrPublishers);

router.use('/:id/komentari', commentsRouter);

export default router;