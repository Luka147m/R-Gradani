import { Router } from 'express';
import * as commentsController from './comments.controller';
import { requireApiKey } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.get('/:id', commentsController.getCommentById);
router.get('/latest/analyzed', commentsController.getLatestAnalyzedComments);

router.post('/', requireApiKey, commentsController.createComment);

export default router;