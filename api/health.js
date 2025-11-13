javascriptexport default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok',
    message: 'Magic Videos API is running',
    timestamp: new Date().toISOString(),
    env: {
      supabase: !!process.env.SUPABASE_URL,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      google: !!process.env.GOOGLE_CLIENT_ID
    }
  });
}
```
