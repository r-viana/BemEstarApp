// src/config/StravaConfig.js
// Configurações da API do Strava

export const STRAVA_CONFIG = {
  // Suas credenciais do Strava (substitua pelos valores reais)
  CLIENT_ID: '167642',
  CLIENT_SECRET: 'c8b35e9ac400fe020dcb4aa4764f40e461848224',
  
  // Configurações de OAuth
  REDIRECT_URI: 'https://bemestarapp.com',
  RESPONSE_TYPE: 'code',
  SCOPE: 'read,activity:read_all,profile:read_all',
  
  // URLs da API Strava
  AUTHORIZATION_URL: 'https://www.strava.com/oauth/authorize',
  TOKEN_URL: 'https://www.strava.com/oauth/token',
  API_BASE_URL: 'https://www.strava.com/api/v3',
  
  // Configurações de deep linking
  SCHEME: 'com.bemestarapp',
  CALLBACK_PATH: 'strava-callback',
  
  // Configurações de sincronização
  MAX_ACTIVITIES_PER_SYNC: 50, // Máximo de atividades por sincronização
  SYNC_DAYS_BACK: 30, // Quantos dias para trás buscar atividades
  
  // Timeouts
  REQUEST_TIMEOUT: 30000, // 30 segundos
  
  // Storage keys para AsyncStorage
  STORAGE_KEYS: {
    ACCESS_TOKEN: '@strava_access_token',
    REFRESH_TOKEN: '@strava_refresh_token',
    TOKEN_EXPIRES_AT: '@strava_token_expires_at',
    USER_INFO: '@strava_user_info',
    LAST_SYNC: '@strava_last_sync',
    CONNECTION_STATUS: '@strava_connected'
  }
};

// URLs auxiliares para construir requisições
export const buildAuthorizationUrl = () => {
  const params = new URLSearchParams({
    client_id: STRAVA_CONFIG.CLIENT_ID,
    redirect_uri: STRAVA_CONFIG.REDIRECT_URI,
    response_type: STRAVA_CONFIG.RESPONSE_TYPE,
    scope: STRAVA_CONFIG.SCOPE,
    approval_prompt: 'force' // Força reautorização
  });
  
  return `${STRAVA_CONFIG.AUTHORIZATION_URL}?${params.toString()}`;
};

// Construir URL para troca de código por token
export const buildTokenExchangeUrl = (authCode) => {
  return {
    url: STRAVA_CONFIG.TOKEN_URL,
    data: {
      client_id: STRAVA_CONFIG.CLIENT_ID,
      client_secret: STRAVA_CONFIG.CLIENT_SECRET,
      code: authCode,
      grant_type: 'authorization_code'
    }
  };
};

// Construir URL para refresh token
export const buildRefreshTokenUrl = (refreshToken) => {
  return {
    url: STRAVA_CONFIG.TOKEN_URL,
    data: {
      client_id: STRAVA_CONFIG.CLIENT_ID,
      client_secret: STRAVA_CONFIG.CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }
  };
};

// Mapeamento de tipos de atividade Strava -> BemEstarApp
export const ACTIVITY_TYPE_MAPPING = {
  // Strava -> BemEstarApp
  'Run': 'Caminhada & Corrida',
  'Walk': 'Caminhada & Corrida',
  'Hike': 'Caminhada & Corrida',
  'Trail Run': 'Caminhada & Corrida',
  'Virtual Run': 'Caminhada & Corrida',
  
  'Ride': 'Ciclismo',
  'Virtual Ride': 'Ciclismo',
  'Mountain Bike Ride': 'Ciclismo',
  'Road Bike Ride': 'Ciclismo',
  'E-Bike Ride': 'Ciclismo',
  
  'Swim': 'Natação',
  'Pool Swim': 'Natação',
  'Open Water Swim': 'Natação',
  
  'Weight Training': 'Musculação',
  'Strength Training': 'Musculação',
  'Crossfit': 'Funcional',
  'HIIT': 'Funcional',
  'Circuit Training': 'Funcional',
  'Functional Fitness': 'Funcional',
  'Workout': 'Funcional',
  
  'Yoga': 'Yoga',
  'Pilates': 'Pilates',
  'Stretching': 'Alongamento',
  'Flexibility': 'Alongamento',
  
  'Dance': 'Dança',
  'Zumba': 'Dança',
  
  'Meditation': 'Meditação',
  'Mindfulness': 'Meditação',
  
  // Tipos que não temos mapeamento exato - usar Funcional como padrão
  'Soccer': 'Funcional',
  'Basketball': 'Funcional',
  'Tennis': 'Funcional',
  'Volleyball': 'Funcional',
  'Rock Climbing': 'Funcional',
  'Kayaking': 'Funcional',
  'Rowing': 'Funcional',
  'Surfing': 'Funcional',
  'Skiing': 'Funcional',
  'Snowboarding': 'Funcional'
};

// Função para mapear tipo de atividade
export const mapStravaActivityType = (stravaType) => {
  return ACTIVITY_TYPE_MAPPING[stravaType] || 'Funcional';
};

// Configurações de log (para debug)
export const LOG_CONFIG = {
  ENABLE_LOGS: __DEV__, // Só ativar logs em desenvolvimento
  LOG_REQUESTS: true,
  LOG_RESPONSES: true,
  LOG_ERRORS: true
};

export default STRAVA_CONFIG;