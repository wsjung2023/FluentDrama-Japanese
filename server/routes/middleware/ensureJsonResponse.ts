// API routes should always return JSON-compatible responses for frontend consistency.
import type { NextFunction, Request, Response } from 'express';

export function ensureJsonResponse(req: Request, res: Response, next: NextFunction) {
  if (req.path?.startsWith('/api')) {
    const currentContentType = res.getHeader('Content-Type');
    if (!currentContentType) {
      res.setHeader('Content-Type', 'application/json');
    }

    const originalSend = res.send.bind(res);
    res.send = ((data: unknown) => {
      if (typeof data === 'string') {
        const trimmed = data.trimStart();
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
          return originalSend(JSON.stringify({ message: data }));
        }
      }

      return originalSend(data as any);
    }) as Response['send'];
  }

  next();
}
