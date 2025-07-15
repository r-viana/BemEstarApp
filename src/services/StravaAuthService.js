// src/services/StravaAuthService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Alert } from 'react-native';
import { STRAVA_CONFIG, buildAuthorizationUrl, buildTokenExchangeUrl, buildRefreshTokenUrl } from '../config/StravaConfig';

/**
 * Serviço de autenticação com Strava
 */
class StravaAuthService {

  /**
   * Verificar se usuário está conectado ao Strava
   */
  async isConnected() {
    try {
      const accessToken = await AsyncStorage.getItem(STRAVA_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      const isConnected = await AsyncStorage.getItem(STRAVA_CONFIG.STORAGE_KEYS.CONNECTION_STATUS);
      
      return isConnected === 'true' && !!accessToken;
    } catch (error) {
      console.log('❌ Erro ao verificar conexão Strava:', error);
      return false;
    }
  }

  /**
   * Obter informações do usuário conectado
   */
  async getUserInfo() {
    try {
      const userInfoString = await AsyncStorage.getItem(STRAVA_CONFIG.STORAGE_KEYS.USER_INFO);
      return userInfoString ? JSON.parse(userInfoString) : null;
    } catch (error) {
      console.log('❌ Erro ao obter info do usuário:', error);
      return null;
    }
  }

  /**
   * Iniciar processo de autenticação
   */
  async startAuth() {
    try {
      console.log('🔗 Iniciando autenticação com Strava...');
      
      const authUrl = buildAuthorizationUrl();
      console.log('📱 URL de autorização:', authUrl);
      
      // Verificar se pode abrir a URL
      const canOpen = await Linking.canOpenURL(authUrl);
      
      if (canOpen) {
        await Linking.openURL(authUrl);
        return { success: true };
      } else {
        throw new Error('Não foi possível abrir o Strava');
      }
    } catch (error) {
      console.log('❌ Erro na autenticação:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao conectar com Strava' 
      };
    }
  }

  /**
   * Processar callback de autorização
   */
  async handleAuthCallback(url) {
    try {
      console.log('🔄 Processando callback:', url);
      
      // Extrair código da URL
      const code = this.extractCodeFromUrl(url);
      
      if (!code) {
        throw new Error('Código de autorização não encontrado');
      }

      console.log('✅ Código extraído:', code);
      
      // Trocar código por tokens
      const tokens = await this.exchangeCodeForTokens(code);
      
      if (tokens) {
        await this.saveTokens(tokens);
        await this.fetchAndSaveUserInfo();
        
        return { success: true, tokens };
      } else {
        throw new Error('Não foi possível obter tokens');
      }
      
    } catch (error) {
      console.log('❌ Erro no callback:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extrair código de autorização da URL
   */
  extractCodeFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('code');
    } catch (error) {
      // Fallback para parsing manual
      const match = url.match(/code=([^&]+)/);
      return match ? match[1] : null;
    }
  }

  /**
   * Trocar código de autorização por tokens
   */
  async exchangeCodeForTokens(authCode) {
    try {
      console.log('🔄 Trocando código por tokens...');
      
      const { url, data } = buildTokenExchangeUrl(authCode);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        timeout: STRAVA_CONFIG.REQUEST_TIMEOUT
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Erro na resposta:', response.status, errorText);
        throw new Error(`Erro na resposta do Strava: ${response.status}`);
      }

      const tokens = await response.json();
      console.log('✅ Tokens obtidos com sucesso');
      
      return tokens;
    } catch (error) {
      console.log('❌ Erro ao trocar código por tokens:', error);
      throw error;
    }
  }

  /**
   * Renovar token de acesso
   */
  async refreshToken() {
    try {
      console.log('🔄 Renovando token...');
      
      const refreshToken = await AsyncStorage.getItem(STRAVA_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        throw new Error('Refresh token não encontrado');
      }

      const { url, data } = buildRefreshTokenUrl(refreshToken);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        timeout: STRAVA_CONFIG.REQUEST_TIMEOUT
      });

      if (!response.ok) {
        throw new Error(`Erro ao renovar token: ${response.status}`);
      }

      const newTokens = await response.json();
      await this.saveTokens(newTokens);
      
      console.log('✅ Token renovado com sucesso');
      return newTokens;
      
    } catch (error) {
      console.log('❌ Erro ao renovar token:', error);
      // Se não conseguir renovar, desconectar
      await this.disconnect();
      throw error;
    }
  }

  /**
   * Verificar se token é válido e renovar se necessário
   */
  async getValidToken() {
    try {
      const accessToken = await AsyncStorage.getItem(STRAVA_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      const expiresAt = await AsyncStorage.getItem(STRAVA_CONFIG.STORAGE_KEYS.TOKEN_EXPIRES_AT);
      
      if (!accessToken || !expiresAt) {
        throw new Error('Token não encontrado');
      }

      const now = Math.floor(Date.now() / 1000);
      const tokenExpiresAt = parseInt(expiresAt);
      
      // Se token expira em menos de 5 minutos, renovar
      if (tokenExpiresAt - now < 300) {
        console.log('🔄 Token expirando em breve, renovando...');
        const newTokens = await this.refreshToken();
        return newTokens.access_token;
      }
      
      return accessToken;
    } catch (error) {
      console.log('❌ Erro ao obter token válido:', error);
      throw error;
    }
  }

  /**
   * Salvar tokens no AsyncStorage
   */
  async saveTokens(tokens) {
    try {
      console.log('💾 Salvando tokens...');
      
      await AsyncStorage.multiSet([
        [STRAVA_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token],
        [STRAVA_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token],
        [STRAVA_CONFIG.STORAGE_KEYS.TOKEN_EXPIRES_AT, tokens.expires_at.toString()],
        [STRAVA_CONFIG.STORAGE_KEYS.CONNECTION_STATUS, 'true']
      ]);
      
      console.log('✅ Tokens salvos com sucesso');
    } catch (error) {
      console.log('❌ Erro ao salvar tokens:', error);
      throw error;
    }
  }

  /**
   * Buscar e salvar informações do usuário
   */
  async fetchAndSaveUserInfo() {
    try {
      console.log('👤 Buscando informações do atleta...');
      
      const token = await this.getValidToken();
      
      const response = await fetch(`${STRAVA_CONFIG.API_BASE_URL}/athlete`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: STRAVA_CONFIG.REQUEST_TIMEOUT
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar atleta: ${response.status}`);
      }

      const athlete = await response.json();
      
      // Salvar informações do usuário
      await AsyncStorage.setItem(
        STRAVA_CONFIG.STORAGE_KEYS.USER_INFO, 
        JSON.stringify(athlete)
      );
      
      console.log('✅ Informações do atleta salvas:', athlete.firstname, athlete.lastname);
      return athlete;
      
    } catch (error) {
      console.log('❌ Erro ao buscar informações do atleta:', error);
      throw error;
    }
  }

  /**
   * Desconectar do Strava
   */
  async disconnect() {
    try {
      console.log('🔌 Desconectando do Strava...');
      
      // Remover todos os dados do AsyncStorage
      const keysToRemove = Object.values(STRAVA_CONFIG.STORAGE_KEYS);
      await AsyncStorage.multiRemove(keysToRemove);
      
      console.log('✅ Desconectado com sucesso');
      return { success: true };
      
    } catch (error) {
      console.log('❌ Erro ao desconectar:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obter estatísticas da conexão
   */
  async getConnectionStats() {
    try {
      const isConnected = await this.isConnected();
      const userInfo = await this.getUserInfo();
      const lastSync = await AsyncStorage.getItem(STRAVA_CONFIG.STORAGE_KEYS.LAST_SYNC);
      
      return {
        isConnected,
        userInfo,
        lastSync: lastSync ? new Date(parseInt(lastSync)) : null
      };
    } catch (error) {
      console.log('❌ Erro ao obter stats:', error);
      return {
        isConnected: false,
        userInfo: null,
        lastSync: null
      };
    }
  }
}

// Exportar instância única (singleton)
export default new StravaAuthService();