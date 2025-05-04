import type { NextApiRequest, NextApiResponse } from 'next'
import fetch from 'node-fetch'

interface HSMatch {
  code: string;
  description: string;
  confidence: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { labels } = req.body as { labels: string[] }
  if (!Array.isArray(labels) || labels.length === 0) {
    return res.status(400).json({ message: 'labels must be a non-empty array of strings' })
  }

  try {
    const apiKey = process.env.SHYFT_API_KEY
    if (!apiKey) {
      throw new Error('Missing SHYFT_API_KEY in environment')
    }

    const response = await fetch('https://api.shyft.com/classifiers/hs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({ labels })
    })

    if (!response.ok) {
      const text = await response.text()
      return res.status(response.status).json({ message: 'HS mapping service error', details: text })
    }

    const data = await response.json()
    // Assume data.matches is HSMatch[][] aligned with labels
    const results: Record<string, HSMatch[]> = {}
    labels.forEach((label, idx) => {
      results[label] = data.matches?.[idx] || []
    })

    return res.status(200).json({ results })
  } catch (err: any) {
    console.error('HS mapping error:', err)
    return res.status(500).json({ message: err.message })
  }
}
