import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  Linking
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { cores } from '../../utils/Cores';
import { 
  verificarConexaoStrava,
  gerarUrlAutorizacao,
  obterInformacoesAtleta,
  desconectarStrava
} from '../../services/StravaService';
import { sincronizarAtividadesDoStrava } from '../../services/AtividadeService';

export default function ConectarStrava({ navigation }) {
  const [conectado, setConectado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [dadosAtleta, setDadosAtleta] = useState(null);
  const [ultimaSincronizacao, setUltimaSincronizacao] = useState(null);

  // Verificar status da conexão quando a tela ganhar foco
  useFocusEffect(
    React.useCallback(() => {
      verificarStatusConexao();
    }, [])
  );

  const verificarStatusConexao = async () => {
    try {
      setCarregando(true);
      const estaConectado = await verificarConexaoStrava();
      setConectado(estaConectado);
      
      if (estaConectado) {
        await carregarDadosAtleta();
      }
    } catch (error) {
      console.error('Erro ao verificar status da conexão:', error);
      setConectado(false);
    } finally {
      setCarregando(false);
    }
  };

  const carregarDadosAtleta = async () => {
    try {
      const atleta = await obterInformacoesAtleta();
      setDadosAtleta(atleta);
    } catch (error) {
      console.error('Erro ao carregar dados do atleta:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do atleta');
    }
  };

  const conectarComStrava = async () => {
    try {
      const urlAutorizacao = gerarUrlAutorizacao();
      
      // Verificar se o app pode abrir a URL
      const podeAbrir = await Linking.canOpenURL(urlAutorizacao);
      
      if (podeAbrir) {
        await Linking.openURL(urlAutorizacao);
      } else {
        Alert.alert(
          'Erro',
          'Não foi possível abrir o Strava. Verifique se o app está instalado.',
          [
            { text: 'OK' },
            { 
              text: 'Abrir no Navegador', 
              onPress: () => Linking.openURL(urlAutorizacao)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erro ao conectar com Strava:', error);
      Alert.alert('Erro', 'Não foi possível conectar com o Strava');
    }
  };

  const sincronizarDados = async () => {
    try {
      setSincronizando(true);
      
      Alert.alert(
        'Sincronizar com Strava',
        'Isso irá buscar suas atividades mais recentes do Strava e sincronizá-las com o app.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Sincronizar', 
            onPress: async () => {
              try {
                const resultado = await sincronizarAtividadesDoStrava();
                
                Alert.alert(
                  'Sincronização Concluída',
                  `${resultado.sincronizadas} atividades sincronizadas do Strava`,
                  [
                    {
                      text: 'Ver Atividades',
                      onPress: () => navigation.navigate('HistoricoDeAtividades')
                    },
                    { text: 'OK' }
                  ]
                );
                
                setUltimaSincronizacao(new Date());
              } catch (error) {
                console.error('Erro na sincronização:', error);
                Alert.alert('Erro', 'Não foi possível sincronizar com o Strava');
              } finally {
                setSincronizando(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao iniciar sincronização:', error);
      setSincronizando(false);
    }
  };

  const desconectarStravaApp = async () => {
    Alert.alert(
      'Desconectar Strava',
      'Tem certeza que deseja desconectar sua conta do Strava? Isso removerá o acesso aos dados do Strava.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Desconectar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await desconectarStrava();
              setConectado(false);
              setDadosAtleta(null);
              setUltimaSincronizacao(null);
              
              Alert.alert('Sucesso', 'Strava desconectado com sucesso');
            } catch (error) {
              console.error('Erro ao desconectar:', error);
              Alert.alert('Erro', 'Não foi possível desconectar o Strava');
            }
          }
        }
      ]
    );
  };

  const formatarData = (data) => {
    if (!data) return 'Nunca';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (carregando) {
    return (
      <View style={estilos.loadingContainer}>
        <ActivityIndicator size="large" color={cores.primaria} />
        <Text style={estilos.loadingText}>Verificando conexão...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={estilos.container}>
      {/* Header */}
      <View style={estilos.header}>
        <Text style={estilos.titulo}>Conectar com Strava</Text>
        <Text style={estilos.subtitulo}>
          Sincronize suas atividades do Strava com o BemEstarApp
        </Text>
      </View>

      {/* Status da Conexão */}
      <View style={estilos.cardStatus}>
        <View style={estilos.statusHeader}>
          <Text style={estilos.statusIcone}>
            {conectado ? '✅' : '❌'}
          </Text>
          <Text style={estilos.statusTitulo}>
            {conectado ? 'Conectado' : 'Não Conectado'}
          </Text>
        </View>
        
        <Text style={estilos.statusDescricao}>
          {conectado 
            ? 'Sua conta do Strava está conectada e sincronizada.'
            : 'Conecte sua conta do Strava para importar suas atividades automaticamente.'
          }
        </Text>
      </View>

      {/* Dados do Atleta */}
      {conectado && dadosAtleta && (
        <View style={estilos.cardAtleta}>
          <Text style={estilos.cardTitulo}>👤 Seus Dados do Strava</Text>
          
          <View style={estilos.dadosAtleta}>
            <View style={estilos.dadoItem}>
              <Text style={estilos.dadoLabel}>Nome:</Text>
              <Text style={estilos.dadoValor}>{dadosAtleta.firstname} {dadosAtleta.lastname}</Text>
            </View>
            
            <View style={estilos.dadoItem}>
              <Text style={estilos.dadoLabel}>País:</Text>
              <Text style={estilos.dadoValor}>{dadosAtleta.country || 'Não informado'}</Text>
            </View>
            
            <View style={estilos.dadoItem}>
              <Text style={estilos.dadoLabel}>Cidade:</Text>
              <Text style={estilos.dadoValor}>{dadosAtleta.city || 'Não informado'}</Text>
            </View>
            
            <View style={estilos.dadoItem}>
              <Text style={estilos.dadoLabel}>Seguidores:</Text>
              <Text style={estilos.dadoValor}>{dadosAtleta.follower_count || 0}</Text>
            </View>
            
            <View style={estilos.dadoItem}>
              <Text style={estilos.dadoLabel}>Seguindo:</Text>
              <Text style={estilos.dadoValor}>{dadosAtleta.friend_count || 0}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Última Sincronização */}
      {conectado && (
        <View style={estilos.cardSincronizacao}>
          <Text style={estilos.cardTitulo}>🔄 Última Sincronização</Text>
          <Text style={estilos.sincronizacaoTexto}>
            {formatarData(ultimaSincronizacao)}
          </Text>
        </View>
      )}

      {/* Botões de Ação */}
      <View style={estilos.areaBotoes}>
        {!conectado ? (
          <TouchableOpacity 
            style={estilos.botaoConectar}
            onPress={conectarComStrava}
          >
            <Text style={estilos.textoBotaoConectar}>🔗 Conectar com Strava</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity 
              style={estilos.botaoSincronizar}
              onPress={sincronizarDados}
              disabled={sincronizando}
            >
              {sincronizando ? (
                <ActivityIndicator size="small" color={cores.branco} />
              ) : (
                <Text style={estilos.textoBotaoSincronizar}>🔄 Sincronizar Atividades</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={estilos.botaoDesconectar}
              onPress={desconectarStravaApp}
            >
              <Text style={estilos.textoBotaoDesconectar}>❌ Desconectar Strava</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Informações */}
      <View style={estilos.cardInfo}>
        <Text style={estilos.infoTitulo}>ℹ️ Como funciona?</Text>
        <Text style={estilos.infoTexto}>
          • Conecte sua conta do Strava para importar atividades automaticamente{'\n'}
          • As atividades serão sincronizadas com o app{'\n'}
          • Você pode sincronizar manualmente a qualquer momento{'\n'}
          • Suas atividades do Strava aparecerão no histórico do app{'\n'}
          • Você pode desconectar a qualquer momento
        </Text>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: cores.fundo,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: cores.textoSecundario,
  },
  header: {
    padding: 20,
    backgroundColor: cores.primaria,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cores.branco,
    marginBottom: 5,
  },
  subtitulo: {
    fontSize: 16,
    color: cores.branco,
    opacity: 0.9,
  },
  cardStatus: {
    backgroundColor: cores.fundoCartao,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusIcone: {
    fontSize: 24,
    marginRight: 10,
  },
  statusTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
  },
  statusDescricao: {
    fontSize: 14,
    color: cores.textoSecundario,
    lineHeight: 20,
  },
  cardAtleta: {
    backgroundColor: cores.fundoCartao,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 15,
  },
  dadosAtleta: {
    gap: 10,
  },
  dadoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dadoLabel: {
    fontSize: 14,
    color: cores.textoSecundario,
    fontWeight: '500',
  },
  dadoValor: {
    fontSize: 14,
    color: cores.texto,
    fontWeight: '600',
  },
  cardSincronizacao: {
    backgroundColor: cores.fundoCartao,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },
  sincronizacaoTexto: {
    fontSize: 16,
    color: cores.texto,
    fontWeight: '600',
  },
  areaBotoes: {
    padding: 20,
    gap: 15,
  },
  botaoConectar: {
    backgroundColor: cores.secundaria,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  textoBotaoConectar: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.branco,
  },
  botaoSincronizar: {
    backgroundColor: cores.primaria,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  textoBotaoSincronizar: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.branco,
  },
  botaoDesconectar: {
    backgroundColor: cores.perigo,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  textoBotaoDesconectar: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.branco,
  },
  cardInfo: {
    backgroundColor: cores.fundoCartao,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 10,
  },
  infoTexto: {
    fontSize: 14,
    color: cores.textoSecundario,
    lineHeight: 20,
  },
}); 