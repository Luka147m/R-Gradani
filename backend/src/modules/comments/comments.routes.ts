import { Router } from 'express';
import * as commentsController from './comments.controller';

const router = Router({ mergeParams: true });

// Dodane dvije nove rute, jedna dohvaca komentar po ID-u,
//  a druga dohvaca najnovije analizirane komentare, da lakse pronadete komentare koji su najnovije analizirani (imaju odgovor od AI).
// Potrebno dodati njih dvoje u openapi specifikaciju.

router.get('/:id', commentsController.getCommentById);
router.get('/latest/analyzed', commentsController.getLatestAnalyzedComments);

export default router;