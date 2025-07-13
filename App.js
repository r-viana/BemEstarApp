import React, { useEffect } from 'react';
import Navegacao from './src/utils/Navegacao';
import { configurarDeepLinking } from './src/utils/StravaCallbackHandler';

export default function App() {
  useEffect(() => {
    // Configurar deep linking para Strava
    configurarDeepLinking();
  }, []);

  return <Navegacao />;
}