export default function handler(req, res) {
  console.log('Function executada!');
  console.log('Query:', req.query);
  console.log('Method:', req.method);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { code, state, error } = req.query;
    
    if (error) {
      return res.status(400).send(`
        <html>
          <body style="text-align: center; padding: 50px; font-family: Arial;">
            <h2>❌ Erro de Autorização</h2>
            <p>Erro: ${error}</p>
            <button onclick="window.close()">Fechar</button>
          </body>
        </html>
      `);
    }
    
    if (!code) {
      return res.status(400).send(`
        <html>
          <body style="text-align: center; padding: 50px; font-family: Arial;">
            <h2>❌ Código não encontrado</h2>
            <p>Query: ${JSON.stringify(req.query)}</p>
            <button onclick="window.close()">Fechar</button>
          </body>
        </html>
      `);
    }

    // Por enquanto, só vamos mostrar sucesso sem trocar o token
    return res.status(200).send(`
      <html>
        <head>
          <title>Sucesso!</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container { 
              background: white; 
              padding: 40px; 
              border-radius: 20px; 
              max-width: 400px; 
            }
            .success { color: #28a745; font-size: 48px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✅</div>
            <h2>Código Recebido!</h2>
            <p><strong>Código:</strong> ${code.substring(0, 20)}...</p>
            <p><strong>User ID:</strong> ${state || 'não fornecido'}</p>
            
            <button onclick="closeWindow()" style="background: #FC4C02; color: white; border: none; padding: 15px 30px; border-radius: 50px; font-size: 16px; cursor: pointer; margin-top: 20px;">
              Fechar
            </button>
            
            <div style="margin-top: 20px; font-size: 14px; color: #999;">
              Fechando em <span id="countdown">3</span> segundos...
            </div>
          </div>
          
          <script>
            let countdown = 3;
            const timer = setInterval(() => {
              countdown--;
              document.getElementById('countdown').textContent = countdown;
              if (countdown <= 0) {
                clearInterval(timer);
                closeWindow();
              }
            }, 1000);
            
            function closeWindow() {
              window.close();
            }
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).send(`
      <html>
        <body style="text-align: center; padding: 50px; font-family: Arial;">
          <h2>❌ Erro Interno</h2>
          <p>${error.message}</p>
          <button onclick="window.close()">Fechar</button>
        </body>
      </html>
    `);
  }
}