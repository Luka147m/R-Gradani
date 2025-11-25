import { Router } from 'express';
import * as commentsController from './comments.controller';

const router = Router({ mergeParams: true });

router.get('/', commentsController.getCommentsByDatasetId);

export default router;