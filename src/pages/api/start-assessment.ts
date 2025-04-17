import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { name, email, url } = req.body;
  if (!name || !email || !url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Simulate assessment ID generation (in production, save to DB)
  const assessmentId = 'asmnt_' + Math.random().toString(36).substr(2, 9);
  res.status(200).json({ assessmentId });
}
