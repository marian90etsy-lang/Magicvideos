// Endpoint de prueba - Magic Videos API
export default function handler(req, res) {
  res.status(200).json({ 
    success: true,
    message: '🎉 Magic Videos API está funcionando',
    timestamp: new Date().toISOString()
  });
}
