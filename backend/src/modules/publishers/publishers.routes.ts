import { Router } from 'express';
import * as publishersController from './publishers.controller';

const router = Router({ mergeParams: true });

router.get('/', publishersController.getPublishers);

export default router;