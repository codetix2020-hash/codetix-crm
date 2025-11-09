import { NextApiRequest, NextApiResponse } from 'next';
import { checkAuth, parseJsonBody } from './leads/_helpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      return res.status(200).json({ status: 'ok', message: 'Endpoint activo' });
    }

    if (req.method === 'POST') {
      if (!checkAuth(req, res)) return;

      const body = parseJsonBody(req);
      return res.status(200).json({ success: true, received: body });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[LEADS API ERROR]', err);
    return res.status(500).json({ error: String(err) });
  }
}
