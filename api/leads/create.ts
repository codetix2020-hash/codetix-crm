import type { NextApiRequest, NextApiResponse } from 'next';
import { checkAuth } from './_helpers';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // ✅ CORS para Google Apps Script
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST, OPTIONS');
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    if (!checkAuth(req, res)) return;

    res.setHeader('Access-Control-Allow-Origin', '*');

    const body =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // ✅ Aquí luego insertaremos en Supabase
    return res.status(200).json({
      success: true,
      inserted: body,
    });
  } catch (err: any) {
    console.error('[CREATE LEADS ERROR]', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
}
