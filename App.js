// App.js
import React, { useEffect } from 'react';
import { Linking, Alert } from 'react-native';
import Navegacao from './src/utils/Navegacao';
import StravaAuthService from './src/services/StravaAuthService';

export default function App() {
  
  useEffect(() => {
    // Configurar listener para deep linking
    const handleDeepLink = (url) => {
      console.log('🔗 Deep link recebido:', url);
      
      // Verificar se é callback do Strava
      if (url.includes('strava-callback')) {
        StravaAuthService.handleAuthCallback(url)
          .then(result => {
            if (result.success) {
              Alert.alert('Sucesso!', 'Conectado ao Strava com sucesso!');
            } else {
              Alert.alert('Erro', result.error || 'Erro ao conectar com Strava');
            }
          })
          .catch(error => {
            console.log('❌ Erro no callback:', error);
            Alert.alert('Erro', 'Erro ao processar callback do Strava');
          });
      }
    };

    // Verificar se app foi aberto via deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listener para deep links quando app já está aberto
    const linkingListener = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Cleanup
    return () => {
      linkingListener?.remove();
    };
  }, []);

  return <Navegacao />;
}