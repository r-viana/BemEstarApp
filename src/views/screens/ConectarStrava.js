// src/views/screens/ConectarStrava.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Linking 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { cores } from '../../utils/Cores';
import { STRAVA_CONFIG, buildAuthorizationUrl } from '../../config/StravaConfig';

export default function ConectarStrava({ navigation }) {
  const [conectado, setConectado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Verificar se já está conectado quando a tela carregar
  useFocusEffect(
    React.useCallback(() => {
      verificarConexaoExistente();
    }, [])
  );

  const verificarConexaoExistente = async () => {
    try {
      // Por enquanto, vamos simular a verificação
      // Depois vamos implementar com AsyncStorage
      setConectado(false);
    } catch (error) {
      console.log('Erro ao verificar conexão:', error);
      setConectado(false);
    }
  };

  const conectarComStrava = async () => {
    try {
      setCarregando(true);
      console.log('🔗 Iniciando conexão com Strava...');
      
      // Construir URL de autorização
      const authUrl = buildAuthorizationUrl();
      console.log('📱 URL de autorização:', authUrl);
      
      // Verificar se pode abrir a URL
      const canOpen = await Linking.canOpenURL(authUrl);
      
      if (canOpen) {
        // Mostrar aviso para o usuário
        Alert.alert(
          'Conectar ao Strava',
          'Você será redirecionado para o Strava para autorizar o acesso. Após autorizar, volte para este app.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Continuar', 
              onPress: async () => {
                await Linking.openURL(authUrl);
                console.log('✅ URL aberta com sucesso');
              }
            }
          ]
        );
      } else {
        throw new Error('Não foi possível abrir o Strava');
      }
      
    } catch (error) {
      console.log('❌ Erro ao conectar:', error);
      Alert.alert('Erro', error.message || 'Não foi possível conectar com o Strava');
    } finally {
      setCarregando(false);
    }
  };

  const desconectarStrava = () => {
    Alert.alert(
      'Desconectar Strava',
      'Tem certeza que deseja desconectar sua conta do Strava?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Desconectar', 
          style: 'destructive',
          onPress: () => {
            setConectado(false);
            Alert.alert('Sucesso', 'Desconectado do Strava com sucesso!');
          }
        }
      ]
    );
  };

  const testarConexao = () => {
    // Botão para testar - simular que conectou
    setConectado(true);
    Alert.alert('Teste', 'Simulando conexão bem-sucedida!');
  };

  return (
    <View style={estilos.container}>
      <View style={estilos.header}>
        <Text style={estilos.titulo}>Conectar com Strava</Text>
        <Text style={estilos.subtitulo}>
          Importe suas atividades do Strava automaticamente
        </Text>
      </View>

      <View style={estilos.cardStatus}>
        {conectado ? (
          <View style={estilos.statusConectado}>
            <Text style={estilos.iconeStatus}>✅</Text>
            <Text style={estilos.textoStatus}>Strava Conectado</Text>
            <Text style={estilos.textoExplicacao}>
              Suas atividades podem ser importadas automaticamente
            </Text>
          </View>
        ) : (
          <View style={estilos.statusDesconectado}>
            <Text style={estilos.iconeStatus}>⚠️</Text>
            <Text style={estilos.textoStatus}>Não conectado ao Strava</Text>
            <Text style={estilos.textoExplicacao}>
              Conecte sua conta para importar atividades automaticamente
            </Text>
          </View>
        )}
      </View>

      <View style={estilos.areaBotoes}>
        {conectado ? (
          <>
            <TouchableOpacity 
              style={[estilos.botao, estilos.botaoSincronizar]}
              onPress={() => Alert.alert('Em breve', 'Sincronização em desenvolvimento')}
            >
              <Text style={estilos.textoBotao}>🔄 Sincronizar Atividades</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[estilos.botao, estilos.botaoDesconectar]}
              onPress={desconectarStrava}
            >
              <Text style={estilos.textoBotao}>Desconectar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={[estilos.botao, estilos.botaoConectar]}
              onPress={conectarComStrava}
              disabled={carregando}
            >
              <Text style={estilos.textoBotao}>
                {carregando ? 'Conectando...' : '🚴‍♂️ Conectar com Strava'}
              </Text>
            </TouchableOpacity>

            {/* Botão de teste - remover depois */}
            <TouchableOpacity 
              style={[estilos.botao, estilos.botaoTeste]}
              onPress={testarConexao}
            >
              <Text style={estilos.textoBotao}>🧪 Testar Conexão (Demo)</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Informações sobre o que é sincronizado */}
      <View style={estilos.cardInfo}>
        <Text style={estilos.tituloInfo}>O que é importado?</Text>
        <Text style={estilos.textoInfo}>
          • Atividades de corrida, caminhada e ciclismo{'\n'}
          • Duração e distância das atividades{'\n'}
          • Data e hora das atividades{'\n'}
          • Localização (se disponível)
        </Text>
        
        <Text style={estilos.tituloInfo}>Segurança</Text>
        <Text style={estilos.textoInfo}>
          Seus dados são importados de forma segura. Você pode desconectar a qualquer momento.
        </Text>
      </View>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 16,
    color: cores.textoSecundario,
    textAlign: 'center',
  },
  cardStatus: {
    margin: 20,
    padding: 20,
    backgroundColor: cores.fundoCartao,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },
  statusConectado: {
    alignItems: 'center',
  },
  statusDesconectado: {
    alignItems: 'center',
  },
  iconeStatus: {
    fontSize: 32,
    marginBottom: 8,
  },
  textoStatus: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 8,
  },
  textoExplicacao: {
    fontSize: 14,
    color: cores.textoSecundario,
    textAlign: 'center',
  },
  areaBotoes: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  botao: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  botaoConectar: {
    backgroundColor: '#FC4C02', // Cor laranja do Strava
  },
  botaoSincronizar: {
    backgroundColor: cores.primaria,
  },
  botaoDesconectar: {
    backgroundColor: cores.perigo,
  },
  botaoTeste: {
    backgroundColor: cores.textoSecundario,
  },
  textoBotao: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.branco,
  },
  cardInfo: {
    margin: 20,
    padding: 20,
    backgroundColor: cores.fundoCartao,
    borderRadius: 12,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },
  tituloInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 8,
    marginTop: 16,
  },
  textoInfo: {
    fontSize: 14,
    color: cores.textoSecundario,
    lineHeight: 20,
  },
});