import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const key = process.env.LEADS_API_KEY || "";
    const header = req.headers.authorization || "";

    return res.status(200).json({
      status: "ok",
      env: process.env.NODE_ENV,
      keyLength: key.length,
      keyPreview: key ? key.substring(0, 4) + "..." + key.substring(key.length - 3) : "NO KEY",
      headerReceived: header,
      headerMatches: header === `Bearer ${key}`
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
