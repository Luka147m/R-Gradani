import { Router } from 'express';
import * as responsesController from './responses.controller';

const router = Router({ mergeParams: true });

router.get('/komentar/:commentId', responsesController.getResponsesByCommentId);
router.get('/:id', responsesController.getResponsesById);

export default router;