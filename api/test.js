export default function handler(req, res) {
  res.status(200).json({ 
    test: true,
    message: 'Test endpoint funcionando'
  });
}
