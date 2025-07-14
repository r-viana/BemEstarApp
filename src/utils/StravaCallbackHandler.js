import * as ExpoLinking from 'expo-linking';
import { Alert } from 'react-native';
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
        const urlObj = ExpoLinking.parse(url);
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
  const subscription = ExpoLinking.addEventListener('url', handleUrl);
  
  // Verificar se o app foi aberto por uma URL
  ExpoLinking.getInitialURL().then((url) => {
    if (url) {
      handleUrl({ url });
    }
  });

  // Retornar função para remover listener
  return () => subscription?.remove();
};
/**
 * Processar callback do Strava (para usar nos componentes)
 */
export const processarCallbackStrava = async (url, navigation) => {
  if (url && url.includes('strava-callback')) {
    const urlObj = ExpoLinking.parse(url);
    const codigo = urlObj.queryParams?.code;
    
    if (codigo) {
      try {
        await trocarCodigoPorToken(codigo);
        navigation.navigate('ConectarStrava');
        Alert.alert('Sucesso!', 'Conta do Strava conectada com sucesso!');
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível conectar com o Strava.');
      }
    }
  }
};

