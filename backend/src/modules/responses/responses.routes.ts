import { Router } from 'express';
import * as responsesController from './responses.controller';

const router = Router({ mergeParams: true });

// Dodane ove dvije rute potrebno napraviti openapi specifikaciju
// Jedna dohvaca pomocu id komentara sve odgovore na taj komentar - vraca listu objekata odgovora
// Druga dohvaca pomocu id odgovora taj odgovor - vraca jedan objekat odgovora
router.get('/komentar/:commentId', responsesController.getResponsesByCommentId);
router.get('/:id', responsesController.getResponsesById);

export default router;