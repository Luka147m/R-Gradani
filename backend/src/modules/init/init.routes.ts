import { Router } from 'express';
import * as initController from './init.controller';
// import initRouter from '../init/init.routes';

const router = Router();

router.get('/', initController.getInit);

export default router;