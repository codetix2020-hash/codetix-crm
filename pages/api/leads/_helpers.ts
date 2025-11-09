import { NextApiRequest, NextApiResponse } from 'next';

export function checkAuth(req: NextApiRequest, res: NextApiResponse): boolean {
  const expected = process.env.LEADS_API_KEY || '';
  const header = req.headers.authorization || '';

  if (!expected) {
    res.status(500).json({ success: false, error: 'LEADS_API_KEY not set' });
    return false;
  }

  if (header !== `Bearer ${expected}`) {
    res.status(401).json({ success: false, error: 'Token incorrecto' });
    return false;
  }

  return true;
}

export function parseJsonBody(req: NextApiRequest) {
  if (typeof req.body === 'string') {
    if (!req.body.length) return {};
    try {
      return JSON.parse(req.body);
    } catch (_error) {
      throw new Error('Body must be valid JSON');
    }
  }

  return req.body || {};
}
