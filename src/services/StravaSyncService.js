import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, SYNC_CONFIG } from './StravaConfig';
import StravaAuthService from './StravaAuthService';
import StravaApiService from './StravaApiService';
import { convertStravaActivity } from '../utils/StravaUtils';
import { getUserId } from './FirebaseConfig';

/**
 * Serviço de sincronização de atividades do Strava
 */
class StravaSyncService {

  /**
   * Verificar se é hora de sincronizar
   */
  async shouldSync(forceSync = false) {
    if (forceSync) return true;

    try {
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      
      if (!lastSync) return true; // Primeira sincronização
      
      const timeSinceLastSync = Date.now() - parseInt(lastSync);
      return timeSinceLastSync > SYNC_CONFIG.MIN_SYNC_INTERVAL;
      
    } catch (error) {
      console.log('Erro ao verificar última sincronização:', error);
      return true;
    }
  }

  /**
   * Obter timestamp da data de cadastro do usuário
   */
  async getUserRegistrationTimestamp() {
    try {
      // Usar a data de cadastro do Firebase Auth
      const { auth } = require('./FirebaseConfig');
      const user = auth.currentUser;
      
      if (user && user.metadata.creationTime) {
        const registrationDate = new Date(user.metadata.creationTime);
        return Math.floor(registrationDate.getTime() / 1000); // Unix timestamp
      }
      
      // Fallback: 30 dias atrás
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return Math.floor(thirtyDaysAgo.getTime() / 1000);
      
    } catch (error) {
      console.log('Erro ao obter data de cadastro:', error);
      
      // Fallback: 30 dias atrás
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return Math.floor(thirtyDaysAgo.getTime() / 1000);
    }
  }

  /**
   * Obter timestamp da última sincronização
   */
  async getLastSyncTimestamp() {
    try {
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      
      if (lastSync) {
        // Converter de milissegundos para segundos (Unix timestamp)
        return Math.floor(parseInt(lastSync) / 1000);
      }
      
      // Se nunca sincronizou, usar data de cadastro
      return await this.getUserRegistrationTimestamp();
      
    } catch (error) {
      console.log('Erro ao obter timestamp da última sync:', error);
      return await this.getUserRegistrationTimestamp();
    }
  }

  /**
   * Salvar timestamp da sincronização
   */
  async saveLastSyncTimestamp() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    } catch (error) {
      console.log('Erro ao salvar timestamp da sync:', error);
    }
  }

  /**
   * Sincronizar atividades do Strava
   */
  async syncActivities(forceSync = false) {
    try {
      console.log('=== INICIANDO SINCRONIZAÇÃO STRAVA ===');
      
      // Verificar se usuário está conectado
      const isConnected = await StravaAuthService.isConnected();
      if (!isConnected) {
        return {
          success: false,
          error: 'Usuário não está conectado ao Strava'
        };
      }

      // Verificar se deve sincronizar
      const shouldSync = await this.shouldSync(forceSync);
      if (!shouldSync) {
        console.log('Sincronização muito recente, pulando...');
        return {
          success: true,
          message: 'Sincronização muito recente',
          activitiesAdded: 0
        };
      }

      // Obter timestamp para filtrar atividades
      const sinceTimestamp = await this.getLastSyncTimestamp();
      console.log('Buscando atividades desde:', new Date(sinceTimestamp * 1000));

      // Buscar atividades do Strava
      const activitiesResult = await StravaApiService.getAllActivitiesSince(sinceTimestamp);
      
      if (!activitiesResult.success) {
        throw new Error(activitiesResult.error);
      }

      const stravaActivities = activitiesResult.data;
      console.log(`Encontradas ${stravaActivities.length} atividades no Strava`);

      if (stravaActivities.length === 0) {
        await this.saveLastSyncTimestamp();
        return {
          success: true,
          message: 'Nenhuma atividade nova encontrada',
          activitiesAdded: 0
        };
      }

      // Converter atividades para formato do app
      const convertedActivities = [];
      
      for (const stravaActivity of stravaActivities) {
        try {
          const converted = convertStravaActivity(stravaActivity);
          convertedActivities.push(converted);
        } catch (error) {
          console.log('Erro ao converter atividade:', stravaActivity.id, error);
          // Continuar com as outras atividades
        }
      }

      console.log(`Convertidas ${convertedActivities.length} atividades`);

      // Salvar atividades no Firebase
      const savedCount = await this.saveActivitiesToFirebase(convertedActivities);
      
      // Atualizar timestamp da sincronização
      await this.saveLastSyncTimestamp();

      console.log('=== SINCRONIZAÇÃO CONCLUÍDA ===');
      
      return {
        success: true,
        message: `${savedCount} atividades sincronizadas`,
        activitiesAdded: savedCount,
        totalFound: stravaActivities.length
      };

    } catch (error) {
      console.log('Erro na sincronização:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido na sincronização'
      };
    }
  }

  /**
   * Salvar atividades convertidas no Firebase
   */
  async saveActivitiesToFirebase(activities) {
    try {
      const { criarAtividade } = require('./AtividadeService');
      let savedCount = 0;

      for (const activity of activities) {
        try {
          // Verificar se atividade já existe (por stravaId)
          const exists = await this.checkIfActivityExists(activity.stravaId);
          
          if (!exists) {
            await criarAtividade(activity);
            savedCount++;
            console.log(`Atividade salva: ${activity.type} - ${activity.stravaId}`);
          } else {
            console.log(`Atividade já existe: ${activity.stravaId}`);
          }
          
        } catch (error) {
          console.log('Erro ao salvar atividade individual:', error);
          // Continuar com as outras
        }
      }

      return savedCount;
      
    } catch (error) {
      console.log('Erro ao salvar atividades no Firebase:', error);
      throw error;
    }
  }

  /**
   * Verificar se atividade já existe no Firebase
   */
  async checkIfActivityExists(stravaId) {
    try {
      const { buscarAtividadesDoUsuario } = require('./AtividadeService');
      const atividades = await buscarAtividadesDoUsuario();
      
      // Verificar se alguma atividade tem o mesmo stravaId
      return atividades.some(atividade => 
        atividade.stravaId === stravaId || 
        atividade.id === `strava_${stravaId}`
      );
      
    } catch (error) {
      console.log('Erro ao verificar se atividade existe:', error);
      return false; // Em caso de erro, assumir que não existe
    }
  }

  /**
   * Obter estatísticas da sincronização
   */
  async getSyncStats() {
    try {
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      const isConnected = await StravaAuthService.isConnected();
      const userInfo = await StravaAuthService.getUserInfo();

      return {
        isConnected,
        lastSync: lastSync ? new Date(parseInt(lastSync)) : null,
        userInfo,
        canSync: isConnected && await this.shouldSync()
      };
      
    } catch (error) {
      console.log('Erro ao obter stats da sync:', error);
      return {
        isConnected: false,
        lastSync: null,
        userInfo: null,
        canSync: false
      };
    }
  }

  /**
   * Forçar nova sincronização
   */
  async forceSyncActivities() {
    return await this.syncActivities(true);
  }
}

// Exportar instância única (singleton)
export default new StravaSyncService();