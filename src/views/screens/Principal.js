import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { cores } from '../../utils/Cores';
import { auth } from '../../services/FirebaseConfig';
import { signOut } from 'firebase/auth';
import { gerarIniciais, gerarCorAvatar } from '../../services/AvatarService';
import { obterEstatisticasComCache, calcularStreakAtual } from '../../services/EstatisticasService';
import { useFocusEffect } from '@react-navigation/native';

export default function Principal({ navigation }) {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [emailUsuario, setEmailUsuario] = useState('');
  const [diasConsecutivos, setDiasConsecutivos] = useState(0);
  const [recordeDias, setRecordeDias] = useState(0);
  const [totalAtividades, setTotalAtividades] = useState(0);
  const [dadosAvatar, setDadosAvatar] = useState({
    iniciais: 'U',
    corFundo: cores.primaria
  });

  // Carregar dados quando a tela ganhar foco
useFocusEffect(
  React.useCallback(() => {
    carregarDadosUsuario();
  }, [])
);

// Manter o listener de autenticação também
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    if (user) {
      carregarDadosUsuario();
    }
  });

  return () => unsubscribe();
}, []);




const carregarDadosUsuario = async () => {
  try {
    const usuario = auth.currentUser;
    if (usuario) {
      // Dados básicos do usuário
      const nome = usuario.displayName || usuario.email.split('@')[0];
      const primeiroNome = usuario.displayName.split(' ')[0];
      const email = usuario.email;
      
      setNomeUsuario(primeiroNome);
      setEmailUsuario(email);
      
      // Gerar avatar com iniciais
      const iniciais = gerarIniciais(nome);
      const corFundo = gerarCorAvatar(nome);
      setDadosAvatar({ iniciais, corFundo });
      
      // Carregar estatísticas e streak real
      try {
        const [estatisticas, streakData] = await Promise.all([
          obterEstatisticasComCache(),
          calcularStreakAtual() // Nova função que você criou
        ]);
        
        if (estatisticas && estatisticas.gerais) {
          setTotalAtividades(estatisticas.gerais.totalAtividades);
        } else {
          setTotalAtividades(0);
        }
        
        // Usar dados reais do streak
        if (streakData) {
          setDiasConsecutivos(streakData.diasConsecutivos);
          setRecordeDias(streakData.recordeDias);
        } else {
          setDiasConsecutivos(0);
          setRecordeDias(0);
        }
        
      } catch (error) {
        console.log('Erro ao carregar estatísticas/streak:', error);
        // Fallback - usuário novo ou erro
        setTotalAtividades(0);
        setDiasConsecutivos(0);
        setRecordeDias(0);
      }
    }
  } catch (error) {
    console.log('Erro ao carregar dados:', error);
  }
};



const obterMensagemMotivacional = () => {
  if (totalAtividades === 0) {
    return "Comece sua jornada hoje!";
  }
  
  if (diasConsecutivos === 0) {
    return "Hora de retomar o ritmo!";
  }
  
  const porcentagem = recordeDias > 0 ? (diasConsecutivos / recordeDias) * 100 : 100;
  
  if (diasConsecutivos >= recordeDias) {
    return "Parabéns! Novo recorde!";
  } else if (porcentagem >= 80) {
    return "Está quase lá!";
  } else if (porcentagem >= 50) {
    return "Você está indo bem!";
  } else if (totalAtividades >= 25) {
    return "Continue assim!";
  } else if (totalAtividades >=5){
    return "Vamos com tudo!";
  } else {
    return "Vamos lá!";
  }
};

  const fazerLogout = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível sair');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={estilos.container}>
      {/* Header com Avatar */}
      <View style={estilos.headerPerfil}>
        <TouchableOpacity 
          style={estilos.areaUsuario}
          onPress={() => navigation.navigate('Perfil')}
          activeOpacity={0.7}
        >
          <View style={estilos.avatarContainer}>
            <View style={[estilos.avatar, { backgroundColor: dadosAvatar.corFundo }]}>
              <Text style={estilos.avatarTexto}>{dadosAvatar.iniciais}</Text>
            </View>
          </View>
          
          <View style={estilos.infoUsuario}>
            <Text style={estilos.nomeUsuario}>{nomeUsuario}</Text>
            <Text style={estilos.emailUsuario}>{emailUsuario}</Text>
          </View>
        </TouchableOpacity>
        
        <View style={estilos.estatisticasHeader}>
          <View style={estilos.estatisticaItem}>
            <Text style={estilos.estatisticaValor}>🔥 {diasConsecutivos}</Text>
            <Text style={estilos.estatisticaLabel}>dias</Text>
          </View>
          <View style={estilos.estatisticaItem}>
            <Text style={estilos.estatisticaValor}>🏆 {recordeDias}</Text>
            <Text style={estilos.estatisticaLabel}>recorde</Text>
          </View>
        </View>
      </View>

      {/* ScrollView para garantir que tudo caiba na tela */}
      <ScrollView contentContainerStyle={estilos.scrollContainer}>

        {/* Área de boas-vindas */}
        <View style={estilos.areaBemVindo}>
          <Text style={estilos.textoBoasVindas}>
            Olá, {nomeUsuario}!
          </Text>
          <Text style={estilos.textoSubtitulo}>
            Bem-vindo de volta!
          </Text>
          
          <View style={estilos.areaEstatisticas}>
            <Text style={estilos.textoStreak}>
              🔥 Você está a {diasConsecutivos} dias consecutivos
            </Text>
            <Text style={estilos.textoStreak}>
              realizando atividades
            </Text>
            
            <Text style={estilos.textoRecorde}>
              🏆 Seu recorde atual é de {recordeDias} dias!
            </Text>
            <Text style={estilos.textoMotivacional}>
              {obterMensagemMotivacional()}
            </Text>
          </View>
        </View>

        {/* Ação rápida - Nova Atividade */}
        <View style={estilos.areaBotaoRapido}>
          <TouchableOpacity 
            style={estilos.botaoNovaAtividade}
            onPress={() => navigation.navigate('TelaFormularioDeAtividade')}
          >
            <Text style={estilos.iconeNovaAtividade}>➕</Text>
            <View style={estilos.textosBotaoNovaAtividade}>
              <Text style={estilos.tituloBotaoNovaAtividade}>Nova Atividade</Text>
              <Text style={estilos.subtituloBotaoNovaAtividade}>Registrar atividade realizada</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Botões do menu principal */}
        <View style={estilos.areaBotoes}>
          <TouchableOpacity 
            style={estilos.botaoMenu}
            onPress={() => navigation.navigate('HealthTracker')}
          >
            <Text style={estilos.textoBotaoMenu}>✅ Health Tracker</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={estilos.botaoMenu}
            onPress={() => navigation.navigate('HistoricoDeAtividades')}
          >
            <Text style={estilos.textoBotaoMenu}>📝 Histórico de Atividades</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={estilos.botaoMenu}
            onPress={() => navigation.navigate('Perfil')}
          >
            <Text style={estilos.textoBotaoMenu}>👤 Meu Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={estilos.botaoMenu}
            onPress={() => navigation.navigate('Configuracoes')}
          >
            <Text style={estilos.textoBotaoMenu}>⚙️ Configurações</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={estilos.botaoMenu}
            onPress={() => navigation.navigate('Estatisticas')}
          >
            <Text style={estilos.textoBotaoMenu}>📊 Estatísticas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={estilos.botaoSair}
            onPress={fazerLogout}
          >
            <Text style={estilos.textoBotaoSair}>🚪 Sair</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: cores.primaria,
  },
  headerPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
    backgroundColor: cores.primaria,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  areaUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 5,
    paddingRight: 10,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: cores.branco,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarTexto: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cores.branco,
  },
  infoUsuario: {
    flex: 1,
  },
  nomeUsuario: {
    fontSize: 25,
    fontWeight: 'bold',
    color: cores.branco,
    marginBottom: 2
  },
  emailUsuario: {
    fontSize: 14,
    color: cores.branco,
    opacity: 0.9,
  },
  estatisticasHeader: {
    alignItems: 'flex-end',
  },
  estatisticaItem: {
    alignItems: 'center',
    marginBottom: 8,
  },
  estatisticaValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.branco,
  },
  estatisticaLabel: {
    fontSize: 10,
    color: cores.branco,
    opacity: 0.8,
  },
  tituloApp: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cores.branco,
  },
  botaoPerfil: {
    backgroundColor: cores.branco,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconePerfilTexto: {
    fontSize: 18,
  },
  areaBemVindo: {
    padding: 20,
    backgroundColor: cores.fundoCartao,
    margin: 20,
    borderRadius: 12,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },
  textoBoasVindas: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 5,
  },
  textoSubtitulo: {
    fontSize: 16,
    color: cores.textoSecundario,
    marginBottom: 20,
  },
  areaEstatisticas: {
    alignItems: 'center',
  },
  textoStreak: {
    fontSize: 16,
    color: cores.texto,
    textAlign: 'center',
  },
  textoRecorde: {
    fontSize: 16,
    color: cores.texto,
    textAlign: 'center',
    marginTop: 10,
  },
  textoMotivacional: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.primaria,
    textAlign: 'center',
    marginTop: 5,
  },
  areaBotaoRapido: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  botaoNovaAtividade: {
    backgroundColor: cores.secundaria,
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  iconeNovaAtividade: {
    fontSize: 32,
    color: cores.branco,
    marginRight: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    textAlign: 'center',
    lineHeight: 40,
  },
  textosBotaoNovaAtividade: {
    flex: 1,
  },
  tituloBotaoNovaAtividade: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cores.branco,
    marginBottom: 4,
  },
  subtituloBotaoNovaAtividade: {
    fontSize: 14,
    color: cores.branco,
    opacity: 0.9,
  },
  areaBotoes: {
    flex: 1,
    paddingHorizontal: 20,
  },
  botaoMenu: {
    backgroundColor: cores.fundoCartao,
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },
  textoBotaoMenu: {
    fontSize: 18,
    color: cores.texto,
    fontWeight: '600',
  },
  botaoSair: {
    backgroundColor: cores.perigo,
    padding: 18,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  textoBotaoSair: {
    fontSize: 18,
    color: cores.branco,
    fontWeight: '600',
    textAlign: 'center',
  },
});