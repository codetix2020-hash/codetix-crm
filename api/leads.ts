import type { NextApiRequest, NextApiResponse } from 'next'
import { checkAuth, parseJsonBody } from './leads/_helpers'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', message: 'Endpoint activo' })
  }

  if (req.method === 'POST') {
    if (!checkAuth(req, res)) {
      return
    }

    try {
      const body = parseJsonBody(req)
      return res.status(200).json({ success: true, received: body })
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Invalid JSON' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method Not Allowed' })
}
