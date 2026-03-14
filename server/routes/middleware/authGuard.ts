// Shared auth guard for route handlers that require authenticated sessions.
import type { Request, Response } from 'express';

type AuthenticatedRequest = Request & {
  isAuthenticated?: () => boolean;
  user?: { id?: string };
};

export function requireAuthenticated(req: AuthenticatedRequest, res: Response): boolean {
  const isAuthenticated = typeof req.isAuthenticated === 'function' && req.isAuthenticated();
  const hasUserId = typeof req.user?.id === 'string' && req.user.id.length > 0;

  if (!isAuthenticated || !hasUserId) {
    res.status(401).json({ message: 'Unauthorized' });
    return false;
  }

  return true;
}
