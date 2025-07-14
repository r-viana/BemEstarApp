// Configurações do Strava API
export const STRAVA_CONFIG = {
  // Suas credenciais (substitua pelo seu Client ID real)
  CLIENT_ID: '167642', // Seu Client ID que você me passou
  
  // URLs da API do Strava
  BASE_URL: 'https://www.strava.com',
  API_URL: 'https://www.strava.com/api/v3',
  
  // OAuth URLs
  AUTHORIZE_URL: 'https://www.strava.com/oauth/mobile/authorize',
  TOKEN_URL: 'https://www.strava.com/oauth/token',
  
  // Scopes (permissões que seu app precisa)
  SCOPE: 'activity:read_all',
  
  // Redirect URI para React Native
REDIRECT_URI: 'http://localhost:3000/exchange_token',
  
  // Rate limits da API
  RATE_LIMITS: {
    REQUESTS_PER_15_MIN: 600,
    REQUESTS_PER_DAY: 40000
  }
};

// Chaves para AsyncStorage
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'strava_access_token',
  REFRESH_TOKEN: 'strava_refresh_token', 
  TOKEN_EXPIRES_AT: 'strava_token_expires_at',
  USER_INFO: 'strava_user_info',
  LAST_SYNC: 'strava_last_sync',
  IS_CONNECTED: 'strava_connected'
};

// Mapeamento de tipos de atividade Strava → Seu App
export const ACTIVITY_TYPE_MAPPING = {
  'Run': 'Caminhada & Corrida',
  'Walk': 'Caminhada & Corrida', 
  'Hike': 'Caminhada & Corrida',
  'Ride': 'Ciclismo',
  'VirtualRide': 'Ciclismo',
  'Swim': 'Natação',
  'WeightTraining': 'Musculação',
  'Workout': 'Funcional',
  'Crossfit': 'Funcional',
  'Yoga': 'Yoga',
  'Pilates': 'Pilates',
  'Dance': 'Dança',
  'Stretching': 'Alongamento',
  'Meditation': 'Meditação',
  'MentalWellness': 'Relaxamento',
  // Fallback para tipos não mapeados
  'DEFAULT': 'Funcional'
};

// Configurações de sincronização
export const SYNC_CONFIG = {
  // Intervalo mínimo entre sincronizações (5 minutos)
  MIN_SYNC_INTERVAL: 5 * 60 * 1000,
  
  // Número máximo de atividades por página
  ACTIVITIES_PER_PAGE: 30,
  
  // Número máximo de páginas para buscar
  MAX_PAGES: 3
};