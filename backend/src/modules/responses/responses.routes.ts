import { Router } from 'express';
import * as responsesController from './responses.controller';

const router = Router({ mergeParams: true });

router.get('/komentar/:commentId', responsesController.getResponsesByCommentId);
router.get('/:id', responsesController.getResponsesById);

router.post('/:responseId/analyze', responsesController.analyzeResponse);

export default router;