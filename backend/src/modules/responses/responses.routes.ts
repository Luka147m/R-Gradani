import { Router } from 'express';
import * as responsesController from './responses.controller';

const router = Router({ mergeParams: true });

router.get('/komentar/:commentId', responsesController.getResponsesByCommentId);
router.get('/:id', responsesController.getResponsesById);

// router.post('/:responseId/analyze', responsesController.analyzeResponse);

// Pokretanje za sve
router.post('/analyze', responsesController.analyzeAll)

// Logovi
router.get("/logs/:jobId", responsesController.getJobStatus);

export default router;