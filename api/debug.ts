import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    return res.status(200).json({
      status: 'ok',
      env: process.env.NODE_ENV,
      leadsApiKey: process.env.LEADS_API_KEY ? 'CARGADO ✅' : 'NO CARGADO ❌'
    });
  } catch (err) {
    console.error('DEBUG ERROR', err);
    return res.status(500).json({
      status: 'error',
      message: 'Error interno en /api/debug',
      error: String(err)
    });
  }
}
