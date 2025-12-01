import { Router } from 'express';
import * as responsesController from './responses.controller';

const router = Router({ mergeParams: true });

router.get('/:id', responsesController.getResponsesByCommentId);

export default router;