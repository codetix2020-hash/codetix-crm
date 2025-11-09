import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  return res.status(200).json({
    status: 'ok',
    env: process.env.NODE_ENV ?? null,
    leadsApiKey: process.env.LEADS_API_KEY ? 'LOADED ✅' : 'NOT LOADED ❌',
  })
}
