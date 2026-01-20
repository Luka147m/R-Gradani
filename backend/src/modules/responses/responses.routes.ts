import { Router } from 'express';
import * as responsesController from './responses.controller';

const router = Router({ mergeParams: true });

router.get('/komentar/:commentId', responsesController.getResponsesByCommentId);
router.get('/:id', responsesController.getResponsesById);

// Pokretanje za jedan skup podataka
router.post('/analyze/:skupId', responsesController.startAnalyzeOne);
// Pokretanje za sve
router.post('/analyze', responsesController.startAnalyzeAll)
// Za otkazivanje
router.post('/analyze/cancel/:jobId', responsesController.cancelAnalysis);
// Logovi
router.get("/logs/:jobId", responsesController.getJobStatus);

export default router;