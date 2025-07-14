const STRAVA_CLIENT_ID = '167642';
const STRAVA_CLIENT_SECRET = 'c8b35e9ac400fe020dcb4aa4764f40e461848224';

exports.handler = async (event, context) => {
  console.log('Netlify function executada!');
  console.log('Query:', event.queryStringParameters);
  console.log('Method:', event.httpMethod);
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'text/html; charset=utf-8'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { code, state, error } = event.queryStringParameters || {};
    
    if (error) {
      const errorHtml = `
        <html>
          <body style="text-align: center; padding: 50px; font-family: Arial;">
            <h2>❌ Erro de Autorização</h2>
            <p>Erro: ${error}</p>
            <button onclick="window.close()">Fechar</button>
          </body>
        </html>
      `;
      return { statusCode: 400, headers, body: errorHtml };
    }
    
    if (!code) {
      const debugHtml = `
        <html>
          <body style="text-align: center; padding: 50px; font-family: Arial;">
            <h2>❌ Código não encontrado</h2>
            <p><strong>Query recebida:</strong></p>
            <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; text-align: left;">${JSON.stringify(event.queryStringParameters, null, 2)}</pre>
            <button onclick="window.close()">Fechar</button>
          </body>
        </html>
      `;
      return { statusCode: 400, headers, body: debugHtml };
    }

    console.log('Código encontrado, trocando por token...');

    // Trocar código por token
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Erro do Strava:', errorText);
      
      const errorHtml = `
        <html>
          <body style="text-align: center; padding: 50px; font-family: Arial;">
            <h2>❌ Erro na troca de token</h2>
            <p>Status: ${tokenResponse.status}</p>
            <p>Erro: ${errorText}</p>
            <button onclick="window.close()">Fechar</button>
          </body>
        </html>
      `;
      return { statusCode: 500, headers, body: errorHtml };
    }

    const tokenData = await tokenResponse.json();
    console.log('Token obtido com sucesso!');

    // Página de sucesso
    const successHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>🎉 Conectado com Sucesso!</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 20px; 
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
            box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
            max-width: 400px;
            animation: slideUp 0.5s ease-out;
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .success { 
            color: #28a745; 
            font-size: 48px; 
            margin-bottom: 20px; 
          }
          .title { 
            color: #333; 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 15px; 
          }
          .athlete { 
            color: #666; 
            margin: 20px 0; 
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
          }
          .athlete-name {
            font-size: 20px;
            font-weight: bold;
            color: #FC4C02;
            margin-bottom: 5px;
          }
          .close-btn { 
            background: #FC4C02; 
            color: white; 
            border: none; 
            padding: 15px 30px; 
            border-radius: 50px; 
            font-size: 16px; 
            font-weight: bold;
            cursor: pointer; 
            margin-top: 20px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✅</div>
          <div class="title">Conectado com Sucesso!</div>
          
          <div class="athlete">
            <div class="athlete-name">${tokenData.athlete.firstname} ${tokenData.athlete.lastname}</div>
            <div>📍 ${tokenData.athlete.city}, ${tokenData.athlete.country}</div>
          </div>
          
          <p>Sua conta do Strava foi conectada com sucesso!</p>
          
          <button class="close-btn" onclick="closeWindow()">
            🔄 Voltar ao App
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
    `;

    return { 
      statusCode: 200, 
      headers, 
      body: successHtml 
    };

  } catch (error) {
    console.error('Erro geral:', error);
    
    const errorHtml = `
      <html>
        <body style="text-align: center; padding: 50px; font-family: Arial;">
          <h2>❌ Erro Interno</h2>
          <p>Detalhes: ${error.message}</p>
          <button onclick="window.close()">Fechar</button>
        </body>
      </html>
    `;
    
    return { 
      statusCode: 500, 
      headers, 
      body: errorHtml 
    };
  }
};