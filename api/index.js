export default function handler(req, res) {
  // Redirecionar para strava-callback se necessário
  if (req.url.includes('strava-callback') || req.query.code) {
    return require('./strava-callback.js').default(req, res);
  }
  
  res.status(200).json({ 
    message: 'Bem Estar App - Servidor ativo',
    timestamp: new Date().toISOString(),
    url: req.url,
    query: req.query
  });
}