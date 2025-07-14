import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  Modal,
  Linking
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { auth, firestore } from '../../services/FirebaseConfig';
import { getDoc, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { httpsCallable,  } from 'firebase/functions';
import { functions } from '../../services/FirebaseConfig';
import { cores } from '../../utils/Cores';

WebBrowser.maybeCompleteAuthSession();


export default function ConectarStrava({ navigation }) {
  const [conectado, setConectado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [dadosAtleta, setDadosAtleta] = useState(null);
  const [showWebView, setShowWebView] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  const STRAVA_CLIENT_ID = '167642';
const NETLIFY_DOMAIN = 'bemestar-app-v2.netlify.app';

  // Verificar conexão existente ao carregar
 useEffect(() => {
  // Verificar sempre que entrar na tela
  const verificarEConectar = async () => {
    console.log('Verificando conexão ao entrar na tela...');
    await verificarConexaoExistente();
  };
  
  verificarEConectar();
}, []);

// Adicionar também no useFocusEffect para verificar sempre que a tela ganhar foco
useFocusEffect(
  React.useCallback(() => {
    console.log('Tela ganhou foco - verificando conexão...');
    verificarConexaoExistente();
  }, [])
);

const verificarConexaoExistente = async () => {
  try {
    const user = auth.currentUser;
    console.log('🔍 Verificando conexão - User:', user?.uid);

    if (!user) {
      console.log('❌ Usuário não logado');
      return;
    }

    // Primeiro verificar dados locais (AsyncStorage)
    console.log('📱 Verificando dados locais...');
    const [localToken, localAthleteData] = await Promise.all([
      AsyncStorage.getItem('strava_access_token'),
      AsyncStorage.getItem('strava_athlete_data')
    ]);

    if (localToken && localAthleteData) {
      console.log('✅ Conexão encontrada localmente');
      setConectado(true);
      setDadosAtleta(JSON.parse(localAthleteData));
      
      // Tentar sincronizar com Firestore em background
      sincronizarComFirestore(user.uid);
      return;
    }

    // Se não tem dados locais, verificar Firestore
    console.log('📋 Verificando Firestore...');
    const userRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      console.log('📄 Documento existe:', doc.exists());
      
      if (doc.exists()) {
        const userData = doc.data();
        console.log('🔗 Strava token:', userData.stravaAccessToken ? 'EXISTS' : 'NOT FOUND');
        console.log('👤 Strava athlete:', userData.stravaAthleteData ? 'EXISTS' : 'NOT FOUND');
        
        if (userData.stravaAccessToken && userData.stravaAthleteData) {
          console.log('✅ Conexão detectada no Firestore');
          setConectado(true);
          setDadosAtleta(userData.stravaAthleteData);
          
          // Salvar localmente para próximas verificações
          salvarDadosLocalmente(userData);
        } else {
          console.log('❌ Conexão não encontrada');
          setConectado(false);
          setDadosAtleta(null);
        }
      } else {
        console.log('❌ Documento do usuário não existe');
        setConectado(false);
        setDadosAtleta(null);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error('❌ Erro ao verificar conexão:', error);
    setConectado(false);
    setDadosAtleta(null);
  }
};

const salvarDadosLocalmente = async (userData) => {
  try {
    await AsyncStorage.setItem('strava_access_token', userData.stravaAccessToken);
    await AsyncStorage.setItem('strava_refresh_token', userData.stravaRefreshToken);
    await AsyncStorage.setItem('strava_athlete_id', userData.stravaAthleteId.toString());
    await AsyncStorage.setItem('strava_athlete_data', JSON.stringify(userData.stravaAthleteData));
    if (userData.stravaExpiresAt) {
      await AsyncStorage.setItem('strava_expires_at', userData.stravaExpiresAt.toString());
    }
    console.log('✅ Dados sincronizados localmente');
  } catch (error) {
    console.error('❌ Erro ao salvar dados localmente:', error);
  }
};

const sincronizarComFirestore = async (userId) => {
  try {
    const [localToken, localRefreshToken, localAthleteId, localAthleteData, localExpiresAt] = await Promise.all([
      AsyncStorage.getItem('strava_access_token'),
      AsyncStorage.getItem('strava_refresh_token'),
      AsyncStorage.getItem('strava_athlete_id'),
      AsyncStorage.getItem('strava_athlete_data'),
      AsyncStorage.getItem('strava_expires_at')
    ]);

    if (localToken && localAthleteData) {
      console.log('🔄 Sincronizando dados locais com Firestore...');
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        stravaAccessToken: localToken,
        stravaRefreshToken: localRefreshToken,
        stravaAthleteId: parseInt(localAthleteId),
        stravaAthleteData: JSON.parse(localAthleteData),
        stravaExpiresAt: localExpiresAt ? parseInt(localExpiresAt) : null,
        stravaConnectedAt: new Date()
      });
      console.log('✅ Dados sincronizados com Firestore');
    }
  } catch (error) {
    console.error('❌ Erro ao sincronizar com Firestore:', error);
  }
};

const salvarDadosStrava = async (tokenData) => {
  try {
    console.log('💾 Salvando dados do Strava...');
    
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuário não logado');
    }

    // Salvar localmente (AsyncStorage)
    await AsyncStorage.setItem('strava_access_token', tokenData.accessToken);
    await AsyncStorage.setItem('strava_refresh_token', tokenData.refreshToken);
    await AsyncStorage.setItem('strava_athlete_id', tokenData.athleteId.toString());
    await AsyncStorage.setItem('strava_athlete_data', JSON.stringify(tokenData.athleteData));
    await AsyncStorage.setItem('strava_expires_at', tokenData.expiresAt.toString());
    
    console.log('✅ Dados salvos localmente');

    // Salvar online (Firestore)
    const userRef = doc(firestore, 'users', user.uid);
    await updateDoc(userRef, {
      stravaAccessToken: tokenData.accessToken,
      stravaRefreshToken: tokenData.refreshToken,
      stravaAthleteId: tokenData.athleteId,
      stravaAthleteData: tokenData.athleteData,
      stravaExpiresAt: tokenData.expiresAt,
      stravaConnectedAt: new Date()
    });
    
    console.log('✅ Dados salvos no Firestore');

    // Atualizar estado local
    setConectado(true);
    setDadosAtleta(tokenData.athleteData);
    
    Alert.alert('Sucesso!', 'Conta do Strava conectada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao salvar dados:', error);
    Alert.alert('Erro', 'Não foi possível salvar os dados do Strava');
  }
};

const conectarComStrava = async () => {
  const user = auth.currentUser;
  if (!user) {
    Alert.alert('Erro', 'Você precisa estar logado para conectar com o Strava');
    return;
  }

  try {
    const callbackUrl = `https://${NETLIFY_DOMAIN}/.netlify/functions/strava-callback`;
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=read,activity:read_all,profile:read_all&state=${user.uid}`;

    console.log('🔗 Abrindo URL de autorização:', authUrl);
    
    // Usar Linking.openURL em vez de WebBrowser
    const canOpen = await Linking.canOpenURL(authUrl);
    
    if (canOpen) {
      await Linking.openURL(authUrl);
      console.log('✅ URL aberta com sucesso');
      
      // Mostrar instruções para o usuário
      Alert.alert(
        'Autorização do Strava',
        'Após autorizar no Strava, volte para este app. A conexão será detectada automaticamente.',
        [{ text: 'Entendi' }]
      );
      
      // Iniciar verificação automática após 3 segundos
      setTimeout(() => {
        console.log('🔄 Iniciando verificação automática...');
        iniciarVerificacaoAutomatica();
      }, 3000);
      
    } else {
      throw new Error('Não foi possível abrir a URL');
    }

  } catch (error) {
    console.error('Erro ao abrir navegador:', error);
    Alert.alert('Erro', 'Não foi possível abrir o navegador');
  }
};

const iniciarVerificacaoAutomatica = () => {
  let tentativas = 0;
  const maxTentativas = 20;
  
  const interval = setInterval(async () => {
    tentativas++;
    console.log(`🔄 Verificação automática ${tentativas}/${maxTentativas}...`);
    
    // Verificar dados locais primeiro
    const localToken = await AsyncStorage.getItem('strava_access_token');
    
    if (localToken) {
      console.log('✅ Conexão detectada! Parando verificação...');
      clearInterval(interval);
      verificarConexaoExistente();
      Alert.alert('Sucesso!', 'Conta do Strava conectada com sucesso!');
      return;
    }
    
    // Verificar Firestore também
    verificarConexaoExistente();
    
    if (tentativas >= maxTentativas) {
      clearInterval(interval);
      console.log('⏰ Timeout da verificação automática');
    }
  }, 2000);
};

const processarDadosDoCallback = (url) => {
  try {
    console.log('🔍 Processando dados do callback...');
    
    const urlParams = new URLSearchParams(url.split('?')[1]);
    
    const tokenData = {
      accessToken: urlParams.get('access_token'),
      refreshToken: urlParams.get('refresh_token'),
      athleteId: parseInt(urlParams.get('athlete_id')),
      athleteData: JSON.parse(decodeURIComponent(urlParams.get('athlete_data'))),
      expiresAt: parseInt(urlParams.get('expires_at')),
      userId: urlParams.get('user_id')
    };
    
    console.log('📊 Dados extraídos:', {
      hasToken: !!tokenData.accessToken,
      hasAthlete: !!tokenData.athleteData,
      athleteName: tokenData.athleteData?.firstname
    });
    
    if (tokenData.accessToken && tokenData.athleteData) {
      console.log('✅ Dados válidos - salvando...');
      salvarDadosStrava(tokenData);
    } else {
      console.log('❌ Dados inválidos ou incompletos');
      Alert.alert('Erro', 'Dados incompletos recebidos do Strava');
    }
  } catch (error) {
    console.error('❌ Erro ao processar callback:', error);
    Alert.alert('Erro', 'Não foi possível processar os dados do Strava');
  }
};

  const onNavigationStateChange = (navState) => {
    console.log('🌐 Navegando para:', navState.url);
    
    // Detectar quando a autorização foi concluída
if (navState.url.includes('bemestar-app-v2.netlify.app/.netlify/functions/strava-callback')) {
      // Aguardar um pouco para o processamento da function
      setTimeout(() => {
        setShowWebView(false);
        verificarConexaoExistente();
      }, 2000);
    }
  };

  const sincronizarAtividades = async () => {
    try {
      setSincronizando(true);
      
      // Chamar Firebase Function para sincronizar
      const syncFunction = httpsCallable(functions, 'syncStravaActivities');
      const result = await syncFunction();
      
      const data = result.data;
      Alert.alert(
        'Sincronização Concluída!', 
        data.message,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      Alert.alert(
        'Erro na Sincronização', 
        'Não foi possível sincronizar as atividades. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setSincronizando(false);
    }
  };


  const abrirStravaNoNavegador = () => {
    if (dadosAtleta) {
      const stravaUrl = `https://www.strava.com/athletes/${dadosAtleta.id}`;
      Linking.openURL(stravaUrl);
    }
  };

  return (
    <View style={estilos.container}>
      <ScrollView>
        <View style={estilos.header}>
          <Text style={estilos.titulo}>Conectar com Strava</Text>
          <Text style={estilos.subtitulo}>
            Importe suas atividades do Strava automaticamente
          </Text>
        </View>

        {carregando && (
          <View style={estilos.carregandoContainer}>
            <ActivityIndicator size="large" color={cores.primaria} />
            <Text style={estilos.carregandoTexto}>Conectando com Strava...</Text>
          </View>
        )}

        {!conectado ? (
          <View style={estilos.secaoDesconectado}>
            <View style={estilos.beneficios}>
              <Text style={estilos.tituloSecao}>🚀 Benefícios da integração:</Text>
              <Text style={estilos.beneficioItem}>• 📊 Importação automática de atividades</Text>
              <Text style={estilos.beneficioItem}>• 🏃‍♂️ Dados de corrida, ciclismo e natação</Text>
              <Text style={estilos.beneficioItem}>• 📈 Histórico completo de exercícios</Text>
              <Text style={estilos.beneficioItem}>• 📱 Sincronização em tempo real</Text>
            </View>

            <View style={estilos.infoTecnica}>
              <Text style={estilos.infoTitulo}>🔒 Conexão segura</Text>
              <Text style={estilos.infoTexto}>
                Seus dados são protegidos com criptografia e você pode desconectar a qualquer momento.
              </Text>
            </View>

           <TouchableOpacity 
  style={[
    estilos.botaoConectar, 
    conectado && { backgroundColor: '#28a745' }
  ]}
  disabled={carregando || conectado}
  onPress={conectado ? null : conectarComStrava}
>
  <Text style={estilos.textoBotaoConectar}>
    {conectado ? '✅ Strava Conectado' : '🔗 Conectar com Strava'}
  </Text>
</TouchableOpacity>
          </View>
        ) : (
          <View style={estilos.secaoConectado}>
            <View style={estilos.dadosAtleta}>
              <Text style={estilos.tituloSecao}>✅ Conta conectada</Text>
              {dadosAtleta && (
                <>
                  <TouchableOpacity onPress={abrirStravaNoNavegador}>
                    <Text style={estilos.nomeAtleta}>
                      {dadosAtleta.firstname} {dadosAtleta.lastname}
                    </Text>
                    <Text style={estilos.infoAtleta}>
                      📍 {dadosAtleta.city}, {dadosAtleta.country}
                    </Text>
                    <Text style={estilos.linkStrava}>
                      👆 Toque para ver perfil no Strava
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TouchableOpacity 
              style={[estilos.botaoSincronizar, sincronizando && estilos.botaoDesabilitado]}
              disabled={sincronizando}
              onPress={sincronizarAtividades}
            >
              {sincronizando ? (
                <View style={estilos.carregandoButton}>
                  <ActivityIndicator size="small" color={cores.branco} />
                  <Text style={estilos.textoBotao}>Sincronizando...</Text>
                </View>
              ) : (
                <Text style={estilos.textoBotao}>📥 Sincronizar Atividades</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={estilos.botaoSecundario}
              onPress={() => navigation.navigate('HistoricoDeAtividades')}
            >
              <Text style={estilos.textoBotaoSecundario}>📋 Ver Atividades</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={estilos.botaoDesconectar}
              onPress={desconectarStrava}
            >
              <Text style={estilos.textoBotaoDesconectar}>🔌 Desconectar Strava</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cores.primaria,
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 16,
    color: cores.textoSecundario,
    textAlign: 'center',
  },
  carregandoContainer: {
    alignItems: 'center',
    padding: 20,
  },
  carregandoTexto: {
    marginTop: 10,
    color: cores.textoSecundario,
  },
  secaoDesconectado: {
    padding: 20,
  },
  beneficios: {
    backgroundColor: cores.branco,
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTecnica: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D2E',
    marginBottom: 5,
  },
  infoTexto: {
    fontSize: 14,
    color: '#2E7D2E',
  },
  tituloSecao: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 15,
  },
  beneficioItem: {
    fontSize: 16,
    color: cores.texto,
    marginBottom: 8,
  },
  botaoConectar: {
    backgroundColor: '#FC4C02',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#FC4C02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  textoBotaoConectar: {
    color: cores.branco,
    fontSize: 18,
    fontWeight: 'bold',
  },
  secaoConectado: {
    padding: 20,
  },
  dadosAtleta: {
    backgroundColor: cores.branco,
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nomeAtleta: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 5,
    textAlign: 'center',
  },
  infoAtleta: {
    fontSize: 16,
    color: cores.textoSecundario,
    marginBottom: 10,
    textAlign: 'center',
  },
  linkStrava: {
    fontSize: 14,
    color: '#FC4C02',
    fontStyle: 'italic',
  },
  botaoSincronizar: {
    backgroundColor: cores.primaria,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  botaoSecundario: {
    backgroundColor: cores.secundaria,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  botaoDesabilitado: {
    backgroundColor: cores.borda,
  },
  carregandoButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textoBotao: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  textoBotaoSecundario: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
  },
  botaoDesconectar: {
    backgroundColor: cores.erro,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  textoBotaoDesconectar: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: cores.primaria,
    paddingTop: 50,
  },
  botaoFechar: {
    padding: 5,
  },
  textoBotaoFechar: {
    color: cores.branco,
    fontSize: 16,
  },
  tituloWebView: {
    color: cores.branco,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 50,
  },
  webView: {
    flex: 1,
  },
});