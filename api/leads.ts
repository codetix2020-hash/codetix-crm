import { NextApiRequest, NextApiResponse } from 'next';
import { checkAuth } from './leads/_helpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', message: 'Endpoint activo' });
  }

  if (req.method === 'POST') {
    if (!checkAuth(req, res)) {
      return;
    }

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      return res.status(200).json({ success: true, received: body });
    } catch (error) {
      return res.status(400).json({ success: false, error: 'Body must be valid JSON' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method Not Allowed' });
}