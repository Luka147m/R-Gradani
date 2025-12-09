import { Router } from 'express';
import * as publishersController from './publishers.controller';

const router = Router({ mergeParams: true });

router.get('/', publishersController.getPublishers);
router.get("/nedavno", publishersController.getRecentlyActivePublishers);
router.post('/search', publishersController.searchPublishers);

export default router;