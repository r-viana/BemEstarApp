import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { getUserId } from './FirebaseConfig';
import { STRAVA_CONFIG } from '../config/StravaConfig';

// Chaves para AsyncStorage
const STORAGE_KEYS = {
  STRAVA_ACCESS_TOKEN: 'strava_access_token',
  STRAVA_REFRESH_TOKEN: 'strava_refresh_token',
  STRAVA_TOKEN_EXPIRES_AT: 'strava_token_expires_at',
  STRAVA_ATHLETE_ID: 'strava_athlete_id',
  STRAVA_LAST_SYNC: 'strava_last_sync'
};

/**
 * Gerar URL de autorização do Strava
 */
export const gerarUrlAutorizacao = () => {
  const params = new URLSearchParams({
    client_id: STRAVA_CONFIG.CLIENT_ID,
    redirect_uri: STRAVA_CONFIG.REDIRECT_URI,
    response_type: 'code',
    scope: 'read,activity:read_all,profile:read_all'
  });
  
  return `${STRAVA_CONFIG.AUTH_URL}?${params.toString()}`;
};

/**
 * Trocar código de autorização por token de acesso
 */
export const trocarCodigoPorToken = async (codigo) => {
  try {
    console.log('Trocando código por token...');
    
    const response = await fetch(STRAVA_CONFIG.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: STRAVA_CONFIG.CLIENT_ID,
        client_secret: STRAVA_CONFIG.CLIENT_SECRET,
        code: codigo,
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na resposta: ${response.status}`);
    }

    const data = await response.json();
    console.log('Token obtido com sucesso');
    
    // Salvar tokens
    await salvarTokens(data);
    
    return data;
  } catch (error) {
    console.error('Erro ao trocar código por token:', error);
    throw error;
  }
};

/**
 * Renovar token de acesso usando refresh token
 */
export const renovarToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.STRAVA_REFRESH_TOKEN);
    
    if (!refreshToken) {
      throw new Error('Refresh token não encontrado');
    }

    console.log('Renovando token...');
    
    const response = await fetch(STRAVA_CONFIG.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: STRAVA_CONFIG.CLIENT_ID,
        client_secret: STRAVA_CONFIG.CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na renovação: ${response.status}`);
    }

    const data = await response.json();
    console.log('Token renovado com sucesso');
    
    // Salvar novos tokens
    await salvarTokens(data);
    
    return data;
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    throw error;
  }
};

/**
 * Salvar tokens no AsyncStorage
 */
const salvarTokens = async (tokenData) => {
  try {
    const expiresAt = new Date().getTime() + (tokenData.expires_in * 1000);
    
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.STRAVA_ACCESS_TOKEN, tokenData.access_token),
      AsyncStorage.setItem(STORAGE_KEYS.STRAVA_REFRESH_TOKEN, tokenData.refresh_token),
      AsyncStorage.setItem(STORAGE_KEYS.STRAVA_TOKEN_EXPIRES_AT, expiresAt.toString()),
      AsyncStorage.setItem(STORAGE_KEYS.STRAVA_ATHLETE_ID, tokenData.athlete.id.toString())
    ]);
    
    console.log('Tokens salvos com sucesso');
  } catch (error) {
    console.error('Erro ao salvar tokens:', error);
    throw error;
  }
};

/**
 * Verificar se token está válido
 */
export const verificarTokenValido = async () => {
  try {
    const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.STRAVA_ACCESS_TOKEN);
    const expiresAt = await AsyncStorage.getItem(STORAGE_KEYS.STRAVA_TOKEN_EXPIRES_AT);
    
    if (!accessToken || !expiresAt) {
      return false;
    }
    
    const agora = new Date().getTime();
    const expiraEm = parseInt(expiresAt);
    
    // Se expira em menos de 5 minutos, renovar
    if (expiraEm - agora < 5 * 60 * 1000) {
      console.log('Token expira em breve, renovando...');
      await renovarToken();
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return false;
  }
};

/**
 * Obter token de acesso válido
 */
export const obterTokenValido = async () => {
  const tokenValido = await verificarTokenValido();
  
  if (!tokenValido) {
    throw new Error('Token do Strava não válido');
  }
  
  return await AsyncStorage.getItem(STORAGE_KEYS.STRAVA_ACCESS_TOKEN);
};

/**
 * Fazer requisição autenticada para API do Strava
 */
const fazerRequisicaoStrava = async (endpoint, options = {}) => {
  try {
    const token = await obterTokenValido();
    
    const response = await fetch(`${STRAVA_CONFIG.API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token inválido, tentar renovar
        await renovarToken();
        const newToken = await obterTokenValido();
        
        // Tentar novamente com novo token
        const retryResponse = await fetch(`${STRAVA_CONFIG.API_BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...options
        });
        
        if (!retryResponse.ok) {
          throw new Error(`Erro na API: ${retryResponse.status}`);
        }
        
        return await retryResponse.json();
      }
      
      throw new Error(`Erro na API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na requisição Strava:', error);
    throw error;
  }
};

/**
 * Obter informações do atleta
 */
export const obterInformacoesAtleta = async () => {
  try {
    console.log('Obtendo informações do atleta...');
    const atleta = await fazerRequisicaoStrava('/athlete');
    
    console.log('Informações do atleta obtidas:', atleta);
    return atleta;
  } catch (error) {
    console.error('Erro ao obter informações do atleta:', error);
    throw error;
  }
};

/**
 * Obter atividades do Strava
 */
export const obterAtividadesStrava = async (pagina = 1, porPagina = 30) => {
  try {
    console.log(`Obtendo atividades do Strava (página ${pagina})...`);
    
    const params = new URLSearchParams({
      page: pagina.toString(),
      per_page: porPagina.toString()
    });
    
    const atividades = await fazerRequisicaoStrava(`/athlete/activities?${params}`);
    
    console.log(`Obtidas ${atividades.length} atividades do Strava`);
    return atividades;
  } catch (error) {
    console.error('Erro ao obter atividades do Strava:', error);
    throw error;
  }
};

/**
 * Obter atividade específica do Strava
 */
export const obterAtividadeStrava = async (idAtividade) => {
  try {
    console.log(`Obtendo atividade ${idAtividade} do Strava...`);
    
    const atividade = await fazerRequisicaoStrava(`/activities/${idAtividade}`);
    
    console.log('Atividade obtida:', atividade);
    return atividade;
  } catch (error) {
    console.error('Erro ao obter atividade do Strava:', error);
    throw error;
  }
};

/**
 * Converter atividade do Strava para formato do app
 */
export const converterAtividadeStrava = (atividadeStrava) => {
  // Mapeamento de tipos do Strava para tipos do app
  const mapeamentoTipos = {
    'Run': 'Caminhada & Corrida',
    'Walk': 'Caminhada & Corrida',
    'Ride': 'Ciclismo',
    'Swim': 'Natação',
    'WeightTraining': 'Musculação',
    'Yoga': 'Yoga',
    'Pilates': 'Pilates',
    'Dance': 'Dança',
    'Crossfit': 'Funcional',
    'Stretching': 'Alongamento',
    'Meditation': 'Meditação',
    'Workout': 'Funcional'
  };

  const tipo = mapeamentoTipos[atividadeStrava.type] || 'Funcional';
  
  return {
    id: `strava_${atividadeStrava.id}`,
    tipo: tipo,
    data: new Date(atividadeStrava.start_date),
    duracaoMinutos: Math.round(atividadeStrava.moving_time / 60),
    local: atividadeStrava.location_city || atividadeStrava.location_state || 'Local não informado',
    isOutdoor: atividadeStrava.type !== 'WeightTraining' && atividadeStrava.type !== 'Yoga',
    distanciaKm: atividadeStrava.distance ? (atividadeStrava.distance / 1000) : 0,
    notas: atividadeStrava.description || '',
    criadoEm: new Date(atividadeStrava.created_at),
    atualizadoEm: new Date(atividadeStrava.updated_at),
    // Dados específicos do Strava
    stravaId: atividadeStrava.id,
    stravaType: atividadeStrava.type,
    stravaName: atividadeStrava.name,
    stravaDistance: atividadeStrava.distance,
    stravaMovingTime: atividadeStrava.moving_time,
    stravaElapsedTime: atividadeStrava.elapsed_time,
    stravaTotalElevationGain: atividadeStrava.total_elevation_gain,
    stravaAverageSpeed: atividadeStrava.average_speed,
    stravaMaxSpeed: atividadeStrava.max_speed,
    stravaAverageHeartrate: atividadeStrava.average_heartrate,
    stravaMaxHeartrate: atividadeStrava.max_heartrate,
    stravaCalories: atividadeStrava.calories,
    stravaMap: atividadeStrava.map,
    // Metadados
    fonte: 'strava',
    sincronizadoEm: new Date()
  };
};

/**
 * Sincronizar atividades do Strava
 */
export const sincronizarAtividadesStrava = async (forcarSincronizacao = false) => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('Usuário não está logado');
    }

    // Verificar última sincronização
    const ultimaSync = await AsyncStorage.getItem(STORAGE_KEYS.STRAVA_LAST_SYNC);
    const agora = new Date().getTime();
    
    if (!forcarSincronizacao && ultimaSync) {
      const tempoDesdeUltimaSync = agora - parseInt(ultimaSync);
      const TEMPO_MINIMO_SYNC = 5 * 60 * 1000; // 5 minutos
      
      if (tempoDesdeUltimaSync < TEMPO_MINIMO_SYNC) {
        console.log('Sincronização muito recente, aguardando...');
        return { sincronizadas: 0, mensagem: 'Sincronização muito recente' };
      }
    }

    console.log('Iniciando sincronização com Strava...');
    
    // Obter atividades do Strava
    const atividadesStrava = await obterAtividadesStrava(1, 50);
    
    if (atividadesStrava.length === 0) {
      console.log('Nenhuma atividade encontrada no Strava');
      return { sincronizadas: 0, mensagem: 'Nenhuma atividade encontrada' };
    }

    // Converter atividades
    const atividadesConvertidas = atividadesStrava.map(converterAtividadeStrava);
    
    // Salvar no Firebase (implementar lógica de salvamento)
    // TODO: Implementar salvamento no Firebase
    
    // Atualizar timestamp de sincronização
    await AsyncStorage.setItem(STORAGE_KEYS.STRAVA_LAST_SYNC, agora.toString());
    
    console.log(`Sincronizadas ${atividadesConvertidas.length} atividades do Strava`);
    
    return {
      sincronizadas: atividadesConvertidas.length,
      mensagem: `${atividadesConvertidas.length} atividades sincronizadas`,
      atividades: atividadesConvertidas
    };
    
  } catch (error) {
    console.error('Erro na sincronização com Strava:', error);
    throw error;
  }
};

/**
 * Verificar se Strava está conectado
 */
export const verificarConexaoStrava = async () => {
  try {
    const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.STRAVA_ACCESS_TOKEN);
    return !!accessToken;
  } catch (error) {
    console.error('Erro ao verificar conexão Strava:', error);
    return false;
  }
};

/**
 * Desconectar Strava
 */
export const desconectarStrava = async () => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.STRAVA_ACCESS_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.STRAVA_REFRESH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.STRAVA_TOKEN_EXPIRES_AT),
      AsyncStorage.removeItem(STORAGE_KEYS.STRAVA_ATHLETE_ID),
      AsyncStorage.removeItem(STORAGE_KEYS.STRAVA_LAST_SYNC)
    ]);
    
    console.log('Strava desconectado com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao desconectar Strava:', error);
    return false;
  }
};

export default {
  gerarUrlAutorizacao,
  trocarCodigoPorToken,
  renovarToken,
  verificarTokenValido,
  obterTokenValido,
  obterInformacoesAtleta,
  obterAtividadesStrava,
  obterAtividadeStrava,
  converterAtividadeStrava,
  sincronizarAtividadesStrava,
  verificarConexaoStrava,
  desconectarStrava
}; 