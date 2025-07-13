import { Linking } from 'react-native';
import * as Linking from 'expo-linking';
import { trocarCodigoPorToken } from '../services/StravaService';

/**
 * Configurar listener para URLs do Strava
 */
export const configurarStravaCallback = (navigation) => {
  const handleUrl = async (url) => {
    console.log('URL recebida:', url);
    
    // Verificar se é uma URL do Strava
    if (url.includes('strava-callback')) {
      try {
        // Extrair código de autorização da URL
        const urlObj = Linking.parse(url);
        const codigo = urlObj.queryParams?.code;
        
        if (codigo) {
          console.log('Código de autorização recebido:', codigo);
          
          // Trocar código por token
          await trocarCodigoPorToken(codigo);
          
          // Navegar de volta para a tela de conexão
          navigation.navigate('ConectarStrava');
          
          // Mostrar mensagem de sucesso
          Alert.alert(
            'Sucesso!',
            'Conta do Strava conectada com sucesso!',
            [{ text: 'OK' }]
          );
        } else {
          console.error('Código de autorização não encontrado na URL');
          Alert.alert(
            'Erro',
            'Não foi possível obter o código de autorização do Strava',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Erro ao processar callback do Strava:', error);
        Alert.alert(
          'Erro',
          'Não foi possível conectar com o Strava. Tente novamente.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // Configurar listener para URLs
  const subscription = Linking.addEventListener('url', handleUrl);
  
  // Verificar se o app foi aberto por uma URL
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleUrl({ url });
    }
  });

  // Retornar função para remover listener
  return () => subscription?.remove();
};

/**
 * Configurar deep linking para o app
 */
export const configurarDeepLinking = (navigation) => {
  // Configurar URL scheme
  const url = Linking.useURL();
  
  if (url) {
    console.log('App aberto via URL:', url);
    
    // Processar URL se for do Strava
    if (url.includes('strava-callback')) {
      const urlObj = Linking.parse(url);
      const codigo = urlObj.queryParams?.code;
      
      if (codigo) {
        console.log('Processando callback do Strava...');
        
        // Processar em background
        trocarCodigoPorToken(codigo)
          .then(() => {
            console.log('Strava conectado com sucesso via deep link');
          })
          .catch((error) => {
            console.error('Erro ao conectar Strava via deep link:', error);
          });
      }
    }
  }
}; 