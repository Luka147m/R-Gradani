import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env';

export const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Bearer token is missing or malformed' });
  }

  const token = authHeader.substring(7); 

  if (token !== env.ADMIN_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }

  next();
};