import { STRAVA_CONFIG, SYNC_CONFIG } from './StravaConfig';
import StravaAuthService from './StravaAuthService';

/**
 * Serviço para chamadas à API do Strava
 */
class StravaApiService {

  /**
   * Fazer requisição autenticada para API do Strava
   */
  async makeAuthenticatedRequest(endpoint, options = {}) {
    try {
      // Obter token válido
      const accessToken = await StravaAuthService.getValidToken();
      
      const url = `${STRAVA_CONFIG.API_URL}${endpoint}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token inválido - reconecte ao Strava');
        }
        if (response.status === 429) {
          throw new Error('Limite de requisições excedido - tente mais tarde');
        }
        throw new Error(`Erro na API: ${response.status}`);
      }

      return await response.json();
      
    } catch (error) {
      console.log('Erro na requisição à API:', error);
      throw error;
    }
  }

  /**
   * Obter informações do atleta logado
   */
  async getAthlete() {
    try {
      console.log('Buscando informações do atleta...');
      const athlete = await this.makeAuthenticatedRequest('/athlete');
      
      console.log('Atleta obtido:', athlete.firstname, athlete.lastname);
      return { success: true, data: athlete };
      
    } catch (error) {
      console.log('Erro ao buscar atleta:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar dados do atleta' 
      };
    }
  }

  /**
   * Obter atividades do atleta
   */
  async getActivities(options = {}) {
    try {
      const {
        page = 1,
        per_page = SYNC_CONFIG.ACTIVITIES_PER_PAGE,
        after = null,  // timestamp Unix para filtrar atividades após esta data
        before = null  // timestamp Unix para filtrar atividades antes desta data
      } = options;

      console.log(`Buscando atividades - página ${page}...`);

      // Construir parâmetros da query
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: per_page.toString()
      });

      if (after) {
        params.append('after', after.toString());
      }
      
      if (before) {
        params.append('before', before.toString());
      }

      const endpoint = `/athlete/activities?${params.toString()}`;
      const activities = await this.makeAuthenticatedRequest(endpoint);
      
      console.log(`Obtidas ${activities.length} atividades da página ${page}`);
      return { success: true, data: activities };
      
    } catch (error) {
      console.log('Erro ao buscar atividades:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar atividades' 
      };
    }
  }

  /**
   * Obter detalhes de uma atividade específica
   */
  async getActivity(activityId) {
    try {
      console.log(`Buscando detalhes da atividade ${activityId}...`);
      
      const activity = await this.makeAuthenticatedRequest(`/activities/${activityId}`);
      
      console.log('Detalhes da atividade obtidos');
      return { success: true, data: activity };
      
    } catch (error) {
      console.log('Erro ao buscar detalhes da atividade:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar detalhes da atividade' 
      };
    }
  }

  /**
   * Obter todas as atividades desde uma data específica
   */
  async getAllActivitiesSince(sinceTimestamp) {
    try {
      let allActivities = [];
      let page = 1;
      let hasMoreData = true;

      console.log('Buscando todas as atividades desde:', new Date(sinceTimestamp * 1000));

      while (hasMoreData && page <= SYNC_CONFIG.MAX_PAGES) {
        const result = await this.getActivities({
          page,
          per_page: SYNC_CONFIG.ACTIVITIES_PER_PAGE,
          after: sinceTimestamp
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        const activities = result.data;
        allActivities = allActivities.concat(activities);

        // Se retornou menos atividades que o limite, não há mais páginas
        hasMoreData = activities.length === SYNC_CONFIG.ACTIVITIES_PER_PAGE;
        page++;

        // Delay pequeno entre requisições para respeitar rate limits
        if (hasMoreData) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      console.log(`Total de atividades obtidas: ${allActivities.length}`);
      return { success: true, data: allActivities };
      
    } catch (error) {
      console.log('Erro ao buscar todas as atividades:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar atividades' 
      };
    }
  }

  /**
   * Obter atividades recentes (últimas 30)
   */
  async getRecentActivities() {
    try {
      console.log('Buscando atividades recentes...');
      
      const result = await this.getActivities({
        page: 1,
        per_page: 30
      });

      if (result.success) {
        console.log(`Obtidas ${result.data.length} atividades recentes`);
      }

      return result;
      
    } catch (error) {
      console.log('Erro ao buscar atividades recentes:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar atividades recentes' 
      };
    }
  }

  /**
   * Verificar rate limits da API
   */
  async checkRateLimits() {
    try {
      // Fazer uma requisição simples para verificar headers de rate limit
      const response = await fetch(`${STRAVA_CONFIG.API_URL}/athlete`, {
        headers: {
          'Authorization': `Bearer ${await StravaAuthService.getValidToken()}`
        }
      });

      const rateLimitLimit = response.headers.get('X-RateLimit-Limit');
      const rateLimitUsage = response.headers.get('X-RateLimit-Usage');

      return {
        limit: rateLimitLimit,
        usage: rateLimitUsage,
        remaining: rateLimitLimit ? rateLimitLimit - rateLimitUsage : null
      };
      
    } catch (error) {
      console.log('Erro ao verificar rate limits:', error);
      return null;
    }
  }
}

// Exportar instância única (singleton)
export default new StravaApiService();