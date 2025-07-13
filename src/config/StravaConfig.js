// Configurações do Strava
// IMPORTANTE: Substitua estas credenciais pelas suas próprias credenciais do Strava
// Para obter credenciais: https://developers.strava.com/

export const STRAVA_CONFIG = {
  // Substitua pelo seu Client ID do Strava
  // Para obter: https://developers.strava.com/ -> Create & Manage Your App
  CLIENT_ID: '167998',
  
  // Substitua pelo seu Client Secret do Strava
  // Para obter: https://developers.strava.com/ -> Create & Manage Your App
  CLIENT_SECRET: '2ccce0dd29516273405b287bc99acb44b067ee8b',
  
  // URI de callback (deve corresponder ao configurado no Strava)
  REDIRECT_URI: 'com.bemestarapp://strava-callback',
  
  // URLs da API do Strava
  AUTH_URL: 'https://www.strava.com/oauth/authorize',
  TOKEN_URL: 'https://www.strava.com/oauth/token',
  API_BASE_URL: 'https://www.strava.com/api/v3'
};

// ⚠️ TESTE SEM STRAVA: Se você não configurar as credenciais,
// o app ainda funcionará normalmente, mas a integração com Strava não estará disponível.

// Instruções para configurar o Strava:
/*
1. Acesse https://developers.strava.com/
2. Faça login ou crie uma conta
3. Clique em "Create & Manage Your App"
4. Preencha os dados:
   - Application Name: BemEstarApp
   - Category: Fitness
   - Website: https://bemestarapp.com (ou seu site)
   - Authorization Callback Domain: com.bemestarapp
5. Clique em "Create"
6. Copie o Client ID e Client Secret
7. Substitua os valores acima
8. Em "Authorization Callback Domain", adicione: com.bemestarapp
*/ 