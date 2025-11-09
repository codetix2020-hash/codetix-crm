import type { NextApiRequest, NextApiResponse } from 'next';
import { checkAuth } from './leads/_helpers';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', message: 'Endpoint activo' });
  }

  if (req.method === 'POST') {
    if (!checkAuth(req, res)) {
      return;
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    return res.status(200).json({ success: true, received: body });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method Not Allowed' });
}