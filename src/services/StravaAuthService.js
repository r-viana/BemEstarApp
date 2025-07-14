import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Alert } from 'react-native';
import { STRAVA_CONFIG, STORAGE_KEYS } from './StravaConfig';

/**
 * Serviço de autenticação com Strava
 */
class StravaAuthService {

  /**
   * Verificar se usuário está conectado ao Strava
   */
  async isConnected() {
    try {
      const isConnected = await AsyncStorage.getItem(STORAGE_KEYS.IS_CONNECTED);
      const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      
      return isConnected === 'true' && !!accessToken;
    } catch (error) {
      console.log('Erro ao verificar conexão Strava:', error);
      return false;
    }
  }

  /**
   * Gerar URL de autorização do Strava
   */
  generateAuthUrl() {
    const params = new URLSearchParams({
      client_id: STRAVA_CONFIG.CLIENT_ID,
      redirect_uri: STRAVA_CONFIG.REDIRECT_URI,
      response_type: 'code',
      scope: STRAVA_CONFIG.SCOPE,
      approval_prompt: 'auto'
    });

    return `${STRAVA_CONFIG.AUTHORIZE_URL}?${params.toString()}`;
  }

  /**
   * Iniciar processo de autenticação
   */
  async authenticate() {
    try {
      const authUrl = this.generateAuthUrl();
      console.log('Abrindo URL de autenticação:', authUrl);
      
      // Verificar se pode abrir a URL
      const canOpen = await Linking.canOpenURL(authUrl);
      
      if (canOpen) {
        await Linking.openURL(authUrl);
        return { success: true };
      } else {
        throw new Error('Não foi possível abrir o Strava');
      }
    } catch (error) {
      console.log('Erro na autenticação:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao conectar com Strava' 
      };
    }
  }

  /**
   * Trocar código de autorização por tokens
   */
  async exchangeCodeForTokens(authCode) {
    try {
      console.log('Trocando código por tokens:', authCode);
      
      const response = await fetch(STRAVA_CONFIG.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: STRAVA_CONFIG.CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET, // Por segurança
          code: authCode,
          grant_type: 'authorization_code'
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const tokenData = await response.json();
      console.log('Tokens recebidos com sucesso');
      
      // Salvar tokens
      await this.saveTokens(tokenData);
      
      return { success: true, data: tokenData };
      
    } catch (error) {
      console.log('Erro ao trocar código por tokens:', error);
      return { 
        success: false, 
        error: 'Não foi possível completar a autenticação' 
      };
    }
  }

  /**
   * Salvar tokens no AsyncStorage
   */
  async saveTokens(tokenData) {
    try {
      const expiresAt = Date.now() + (tokenData.expires_in * 1000);
      
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.access_token),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refresh_token),
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(tokenData.athlete)),
        AsyncStorage.setItem(STORAGE_KEYS.IS_CONNECTED, 'true')
      ]);
      
      console.log('Tokens salvos com sucesso');
    } catch (error) {
      console.log('Erro ao salvar tokens:', error);
      throw error;
    }
  }

  /**
   * Obter token válido (renovar se necessário)
   */
  async getValidToken() {
    try {
      const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const expiresAt = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      
      if (!accessToken || !expiresAt) {
        throw new Error('Tokens não encontrados');
      }

      // Verificar se token ainda é válido (margem de 5 minutos)
      const now = Date.now();
      const tokenExpiresAt = parseInt(expiresAt);
      
      if (now < (tokenExpiresAt - 5 * 60 * 1000)) {
        return accessToken; // Token ainda válido
      }
      
      // Token expirando, renovar
      console.log('Token expirando, renovando...');
      const renewResult = await this.renewToken();
      
      if (renewResult.success) {
        return renewResult.accessToken;
      } else {
        throw new Error('Não foi possível renovar token');
      }
      
    } catch (error) {
      console.log('Erro ao obter token válido:', error);
      throw error;
    }
  }

  /**
   * Renovar token usando refresh token
   */
  async renewToken() {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        throw new Error('Refresh token não encontrado');
      }

      const response = await fetch(STRAVA_CONFIG.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: STRAVA_CONFIG.CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao renovar token');
      }

      const tokenData = await response.json();
      await this.saveTokens(tokenData);
      
      console.log('Token renovado com sucesso');
      return { 
        success: true, 
        accessToken: tokenData.access_token 
      };
      
    } catch (error) {
      console.log('Erro ao renovar token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obter informações do usuário Strava
   */
  async getUserInfo() {
    try {
      const userInfo = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.log('Erro ao obter info do usuário:', error);
      return null;
    }
  }

  /**
   * Desconectar do Strava
   */
  async disconnect() {
    try {
      // Limpar todos os dados do Strava
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_INFO),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC),
        AsyncStorage.removeItem(STORAGE_KEYS.IS_CONNECTED)
      ]);
      
      console.log('Desconectado do Strava com sucesso');
      return { success: true };
      
    } catch (error) {
      console.log('Erro ao desconectar do Strava:', error);
      return { 
        success: false, 
        error: 'Erro ao desconectar' 
      };
    }
  }
}

// Exportar instância única (singleton)
export default new StravaAuthService();