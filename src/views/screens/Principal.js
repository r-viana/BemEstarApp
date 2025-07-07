import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { cores } from '../../utils/Cores';
import { auth } from '../../services/FirebaseConfig';
import { signOut } from 'firebase/auth';

export default function Principal({ navigation }) {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [diasConsecutivos, setDiasConsecutivos] = useState(0);
  const [recordeDias, setRecordeDias] = useState(0);

  useEffect(() => {
    carregarDadosUsuario();
  }, []);

  const carregarDadosUsuario = async () => {
    try {
      // Por enquanto, vamos usar dados temporários
      // Depois vamos buscar do Firestore
      const usuario = auth.currentUser;
      if (usuario) {
        // Usar displayName se existir, senão usar parte do email
        const nome = usuario.displayName || usuario.email.split('@')[0];
        setNomeUsuario(nome);
        
        // Dados temporários para teste
        setDiasConsecutivos(17);
        setRecordeDias(45);
      }
    } catch (error) {
      console.log('Erro ao carregar dados:', error);
    }
  };

  const obterMensagemMotivacional = () => {
    const porcentagem = (diasConsecutivos / recordeDias) * 100;
    
    if (diasConsecutivos >= recordeDias) {
      return "Parabéns! Novo recorde!";
    } else if (porcentagem >= 80) {
      return "Está quase lá!";
    } else if (porcentagem >= 50) {
      return "Você está indo bem!";
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
      {/* Header */}
      <View style={estilos.header}>
        <Text style={estilos.tituloApp}>Bem Estar App</Text>
        <TouchableOpacity 
          style={estilos.botaoPerfil}
          onPress={() => navigation.navigate('Perfil')}
        >
          <Text style={estilos.iconePerfilTexto}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* ScrollView para garantir que tudo caiba na tela */}
      <ScrollView contentContainerStyle={estilos.scrollContainer}></ScrollView>

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

      {/* Botões principais */}
      <View style={estilos.areaBotoes}>
        <TouchableOpacity 
          style={estilos.botaoMenu}
          onPress={() => navigation.navigate('HealthTracker')}
        >
          <Text style={estilos.textoBotaoMenu}>✅ Health Tracker</Text>
        </TouchableOpacity>

        <TouchableOpacity
        style={estilos.botaoMenu}
        // AQUI ESTÁ A MUDANÇA: Apontando para a rota correta
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
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  scrollContainer: { // Estilo para o conteúdo do ScrollView
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

