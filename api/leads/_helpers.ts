import type { NextApiRequest, NextApiResponse } from 'next'

export function checkAuth(req: NextApiRequest, res: NextApiResponse): boolean {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    res.status(401).json({ success: false, error: 'Falta header Authorization' })
    return false
  }

  const [type, token] = authHeader.split(' ')

  if (type !== 'Bearer' || !token) {
    res.status(401).json({ success: false, error: 'Formato de token inválido' })
    return false
  }

  if (token !== process.env.LEADS_API_KEY) {
    res.status(401).json({ success: false, error: 'Token incorrecto' })
    return false
  }

  return true
}

export function parseJsonBody<T = any>(req: NextApiRequest): T {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T
    } catch (error) {
      throw new Error('Body must be valid JSON')
    }
  }

  return req.body as T
}
