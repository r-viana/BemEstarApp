

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Modal, TextInput, ActivityIndicator} from 'react-native';
import { cores } from '../../utils/Cores';
import { auth } from '../../services/FirebaseConfig';
import { signOut, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { gerarIniciais, gerarCorAvatar } from '../../services/AvatarService';


import EditarNome from '../components/EditarNome';
import EditarEmail from '../components/EditarEmail';

export default function Perfil({ navigation }) {
  const [carregando, setCarregando] = useState(false);
  const [modalEditarEmailVisivel, setModalEditarEmailVisivel] = useState(false);
  const [modalAlterarSenha, setModalAlterarSenha] = useState({ 
    visivel: false, 
    etapa: 'confirmar', // 'confirmar' ou 'nova'
    senhaAtual: '', 
    novaSenha: '', 
    confirmarNovaSenha: '' 
});
  const [modalEditarNome, setModalEditarNome] = useState(false);
  



const [dadosUsuario, setDadosUsuario] = useState({
  nome: '',
  email: '',
  dataCadastro: '',
  diasConsecutivos: 0,
  recordeDias: 0,
  totalAtividades: 0
});

const [dadosAvatar, setDadosAvatar] = useState({
  iniciais: 'U',
  corFundo: cores.primaria
});


  useEffect(() => {
    const carregarDadosUsuario = () => {
      const usuario = auth.currentUser;
      if (usuario) {
        setDadosUsuario({
          nome: usuario.displayName || 'Usuário',
          email: usuario.email || 'N/A',
          dataCadastro: usuario.metadata.creationTime ? new Date(usuario.metadata.creationTime).toLocaleDateString('pt-BR') : 'N/A',
          diasConsecutivos: 0, // Estes podem ser carregados de outro lugar, se houver
          recordeDias: 0,     // Estes podem ser carregados de outro lugar, se houver
          totalAtividades: 0  // Estes podem ser carregados de outro lugar, se houver
        });
        const nome = usuario.displayName || 'Usuário';
        const iniciais = gerarIniciais(nome);
        const corFundo = gerarCorAvatar(nome);
    setDadosAvatar({ iniciais, corFundo });
        // Se você tiver dados adicionais do usuário em Firestore/Realtime DB, carregue-os aqui também
        // Ex: carregarDadosAdicionaisDoBanco(usuario.uid);
      } else {
        setDadosUsuario({
          nome: '',
          email: '',
          dataCadastro: '',
          diasConsecutivos: 0,
          recordeDias: 0,
          totalAtividades: 0
        });
      }
    };

    // Este listener garante que os dados do usuário sejam atualizados
    // sempre que o estado de autenticação mudar (login, logout, atualização de perfil)
    const unsubscribe = auth.onAuthStateChanged(user => {
      carregarDadosUsuario();
    });

    // Retorna uma função de limpeza para desinscrever o listener quando o componente for desmontado
    return unsubscribe;
  }, []); // O array de dependências vazio significa que ele roda uma vez na montagem e na desmontagem



  const carregarDadosUsuario = async () => {
    try {
      const usuario = auth.currentUser;
      if (usuario) {
        const nome = usuario.displayName || usuario.email.split('@')[0];
        const dataCadastro = usuario.metadata.creationTime 
          ? new Date(usuario.metadata.creationTime).toLocaleDateString('pt-BR')
          : 'Data não disponível';

        setDadosUsuario({
          nome: nome,
          email: usuario.email,
          dataCadastro: dataCadastro,
          diasConsecutivos: 17, // Dados temporários
          recordeDias: 45,
          totalAtividades: 123
        });
        const iniciais = gerarIniciais(nome);
        const corFundo = gerarCorAvatar(nome);
        setDadosAvatar({ iniciais, corFundo });
        
      }
    } catch (error) {
      console.log('Erro ao carregar dados:', error);
    }
  };

  const fazerLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.log('Erro ao fazer logout:', error);
    }
  };

  const confirmarLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: fazerLogout
        }
      ]
    );
  };



const abrirModalAlterarSenha = () => {
  Alert.alert(
    'Alterar Senha',
    'Requisitos da nova senha:\n\n• Mínimo 6 caracteres\n• Pode conter números e letras\n\nApós a alteração, você será desconectado e precisará fazer login novamente.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Continuar', 
        onPress: () => {
          console.log('Abrindo modal para alterar senha...');
          setModalAlterarSenha({
            visivel: true,
            etapa: 'confirmar',
            senhaAtual: '',
            novaSenha: '',
            confirmarNovaSenha: ''
          });
        }
      }
    ]
  );
};

const fecharModalAlterarSenha = () => {
  setModalAlterarSenha({
    visivel: false,
    etapa: 'confirmar',
    senhaAtual: '',
    novaSenha: '',
    confirmarNovaSenha: ''
  });
};

const confirmarSenhaAtual = async () => {
  console.log('Verificando senha atual...');
  
  if (!modalAlterarSenha.senhaAtual.trim()) {
    Alert.alert('Erro', 'Digite sua senha atual');
    return;
  }

  try {
    console.log('Tentando re-autenticar com senha atual...');
    const usuario = auth.currentUser;
    const credential = EmailAuthProvider.credential(usuario.email, modalAlterarSenha.senhaAtual);
    await reauthenticateWithCredential(usuario, credential);
    
    console.log('Re-autenticação bem-sucedida, indo para próxima etapa...');
    setModalAlterarSenha(prev => ({
      ...prev,
      etapa: 'nova'
    }));
    
  } catch (error) {
    console.log('Erro na re-autenticação:', error);
    
    let mensagemErro = 'Senha incorreta';
    if (error.code === 'auth/invalid-login-credentials') {
      mensagemErro = 'Senha atual incorreta';
    }
    
    Alert.alert('Erro', mensagemErro);
  }
};

const salvarNovaSenha = async () => {
  console.log('Validando nova senha...');
  
  // Validar se campos não estão vazios
  if (!modalAlterarSenha.novaSenha.trim() || !modalAlterarSenha.confirmarNovaSenha.trim()) {
    Alert.alert('Erro', 'Preencha todos os campos');
    return;
  }
  
  // Validar tamanho mínimo
  if (modalAlterarSenha.novaSenha.length < 6) {
    Alert.alert('Erro', 'A nova senha deve ter pelo menos 6 caracteres');
    return;
  }
  
  // Validar se senhas coincidem
  if (modalAlterarSenha.novaSenha !== modalAlterarSenha.confirmarNovaSenha) {
    Alert.alert('Erro', 'As senhas não coincidem');
    return;
  }
  
  setCarregando(true);
  try {
    console.log('Atualizando senha...');
    const usuario = auth.currentUser;
    await updatePassword(usuario, modalAlterarSenha.novaSenha);
    
    console.log('Senha atualizada com sucesso!');
    fecharModalAlterarSenha();
    
    Alert.alert(
      'Senha Alterada!',
      'Sua senha foi alterada com sucesso. Você será desconectado para fazer login com a nova senha.',
      [{ 
        text: 'OK', 
        onPress: () => {
          console.log('Fazendo logout automático após alteração de senha...');
          fazerLogout();
        }
      }]
    );
    
  } catch (error) {
    console.log('Erro ao alterar senha:', error);
    
    let mensagemErro = 'Não foi possível alterar a senha';
    if (error.code === 'auth/weak-password') {
      mensagemErro = 'A senha é muito fraca';
    }
    
    Alert.alert('Erro', mensagemErro);
  } finally {
    setCarregando(false);
  }
};

const voltarParaSenhaAtual = () => {
  console.log('Voltando para confirmar senha atual...');
  setModalAlterarSenha(prev => ({
    ...prev,
    etapa: 'confirmar',
    novaSenha: '',
    confirmarNovaSenha: ''
  }));
};

return (
  <ScrollView style={estilos.container}>
    {/* Header com Avatar - Igual ao Principal */}
<View style={estilos.headerPerfil}>
  <TouchableOpacity 
    style={estilos.areaUsuario}
    onPress={() => navigation.goBack()} // Voltar para a tela anterior
    activeOpacity={0.7}
  > 
    <View style={estilos.avatarContainer}>
      <View style={[estilos.avatarCirculo, { backgroundColor: dadosAvatar.corFundo }]}>
        <Text style={estilos.avatarTexto}>{dadosAvatar.iniciais}</Text>
      </View>
    </View>
    
    <View style={estilos.infoUsuario}>
      <Text style={estilos.nomeUsuario}>{dadosUsuario.nome}</Text>
      <Text style={estilos.emailUsuario}>{dadosUsuario.email}</Text>
    </View>
  </TouchableOpacity>
  
  <View style={estilos.estatisticasHeader}>
    <View style={estilos.estatisticaItem}>
      <Text style={estilos.estatisticaValor}>🔥 {dadosUsuario.diasConsecutivos}</Text>
      <Text style={estilos.estatisticaLabel}>dias</Text>
    </View>
    <View style={estilos.estatisticaItem}>
      <Text style={estilos.estatisticaValor}>🏆 {dadosUsuario.recordeDias}</Text>
      <Text style={estilos.estatisticaLabel}>recorde</Text>
    </View>
  </View>
</View>

    {/* Seção de Estatísticas */}
    <View style={estilos.secaoEstatisticas}>
      <Text style={estilos.tituloSecao}>Estatísticas</Text>
      <View style={estilos.cardEstatistica}>
        <View style={estilos.itemEstatistica}>
          <Text style={estilos.numeroEstatistica}>{dadosUsuario.diasConsecutivos}</Text>
          <Text style={estilos.labelEstatistica}>Dias{'\n'}Consecutivos</Text>
        </View>
        <View style={estilos.itemEstatistica}>
          <Text style={estilos.numeroEstatistica}>{dadosUsuario.recordeDias}</Text>
          <Text style={estilos.labelEstatistica}>Recorde{'\n'}de Dias</Text>
        </View>
        <View style={estilos.itemEstatistica}>
          <Text style={estilos.numeroEstatistica}>{dadosUsuario.totalAtividades}</Text>
          <Text style={estilos.labelEstatistica}>Total de{'\n'}Atividades</Text>
        </View>
      </View>
    </View>

    {/* Seção de Informações */}
    <View style={estilos.secaoInformacoes}>
      <Text style={estilos.tituloSecao}>Informações</Text>
      <View style={estilos.cardInformacoes}>
        <View style={estilos.itemInformacao}>
          <Text style={estilos.labelInformacao}>Nome:</Text>
          <View style={estilos.valorComIcone}>
            <Text style={estilos.valorInformacao}>{dadosUsuario.nome}</Text>
            <TouchableOpacity 
              style={estilos.iconeEditar}
              onPress={() => setModalEditarNome(true)}
            >
              <Text style={estilos.textoIconeEditar}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={estilos.itemInformacao}>
          <Text style={estilos.labelInformacao}>Email:</Text>
          <View style={estilos.valorComIcone}>
            <Text style={estilos.valorInformacao}>{dadosUsuario.email}</Text>
            <TouchableOpacity 
              style={estilos.iconeEditar}
              onPress={() => setModalEditarEmailVisivel(true)}
              >
              <Text style={estilos.textoIconeEditar}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={estilos.itemInformacao}>
          <Text style={estilos.labelInformacao}>Membro desde:</Text>
          <Text style={estilos.valorInformacao}>{dadosUsuario.dataCadastro}</Text>
        </View>
      </View>
    </View>

    {/* Seção de Botões */}
    <View style={estilos.secaoBotoes}>
      <TouchableOpacity 
        style={estilos.botaoAcao}
        onPress={abrirModalAlterarSenha}
      >
        <Text style={estilos.textoBotaoAcao}>🔐 Alterar Senha</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={estilos.botaoSair}
        onPress={confirmarLogout}
      >
        <Text style={estilos.textoBotaoSair}>🚪 Sair da Conta</Text>
      </TouchableOpacity>
    </View>
    
    
    
    {/*Componente de Editar Nome */}
    <EditarNome
      visivel={modalEditarNome} // Estado que controla a visibilidade do modal de nome
      nomeAtual={dadosUsuario.nome} // Passa o nome atual do usuário para o modal
      onFechar={() => setModalEditarNome(false)} // Função para fechar o modal
      onSucesso={(novoNome) => { // Função chamada quando o nome é salvo com sucesso
        setDadosUsuario(prev => ({ ...prev, nome: novoNome })); // Atualiza o nome no estado de dadosUsuario
      }}
    />
          {/* Componente de Edição de Email */}
      <EditarEmail
        visivel={modalEditarEmailVisivel}
        fecharModal={() => setModalEditarEmailVisivel(false)}
        emailAtual={dadosUsuario.email}
        onSucesso={(novoEmail) => {
          setDadosUsuario(prev => ({ ...prev, email: novoEmail }));
        }}
        onLogout={() => {
          fazerLogout();
        }}
      />

    {/* Modal de Alterar Senha */}
    <Modal
      visible={modalAlterarSenha.visivel}
      transparent={true}
      animationType="slide"
      onRequestClose={fecharModalAlterarSenha}
    >
      <View style={estilos.modalOverlay}>
        <View style={estilos.modalContainer}>
          <Text style={estilos.modalTitulo}>Alterar Senha</Text>
          
          {modalAlterarSenha.etapa === 'confirmar' ? (
            // Primeira etapa: Confirmar senha atual
            <>
              <Text style={estilos.modalSubtitulo}>
                Para sua segurança, digite sua senha atual:
              </Text>
              
              <TextInput
                style={estilos.modalInput}
                value={modalAlterarSenha.senhaAtual}
                onChangeText={(senha) => setModalAlterarSenha(prev => ({ ...prev, senhaAtual: senha }))}
                placeholder="Digite sua senha atual"
                secureTextEntry={true}
                autoFocus={true}
                editable={!carregando}
              />
              
              <View style={estilos.modalBotoes}>
                <TouchableOpacity 
                  style={[estilos.botaoModalCancelar, carregando && estilos.botaoDesabilitado]}
                  onPress={fecharModalAlterarSenha}
                  disabled={carregando}
                >
                  <Text style={estilos.textoBotaoModalCancelar}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[estilos.botaoModalConfirmar, carregando && estilos.botaoDesabilitado]}
                  onPress={confirmarSenhaAtual}
                  disabled={carregando}
                >
                  {carregando ? (
                    <ActivityIndicator size="small" color={cores.branco} />
                  ) : (
                    <Text style={estilos.textoBotaoModalConfirmar}>Continuar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // Segunda etapa: Definir nova senha
            <>
              <Text style={estilos.modalSubtitulo}>
                Digite sua nova senha (mínimo 6 caracteres):
              </Text>
              
              <TextInput
                style={estilos.modalInput}
                value={modalAlterarSenha.novaSenha}
                onChangeText={(senha) => setModalAlterarSenha(prev => ({ ...prev, novaSenha: senha }))}
                placeholder="Digite a nova senha"
                secureTextEntry={true}
                autoFocus={true}
                editable={!carregando}
              />
              
              <TextInput
                style={estilos.modalInput}
                value={modalAlterarSenha.confirmarNovaSenha}
                onChangeText={(senha) => setModalAlterarSenha(prev => ({ ...prev, confirmarNovaSenha: senha }))}
                placeholder="Confirme a nova senha"
                secureTextEntry={true}
                editable={!carregando}
              />
              
              <View style={estilos.modalBotoes}>
                <TouchableOpacity 
                  style={[estilos.botaoModalCancelar, carregando && estilos.botaoDesabilitado]}
                  onPress={voltarParaSenhaAtual}
                  disabled={carregando}
                >
                  <Text style={estilos.textoBotaoModalCancelar}>Voltar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[estilos.botaoModalConfirmar, carregando && estilos.botaoDesabilitado]}
                  onPress={salvarNovaSenha}
                  disabled={carregando}
                >
                  {carregando ? (
                    <ActivityIndicator size="small" color={cores.branco} />
                  ) : (
                    <Text style={estilos.textoBotaoModalConfirmar}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>

    {/* Loading Overlay */}
    {carregando && (
      <View style={estilos.loadingOverlay}>
        <View style={estilos.loadingContainer}>
          <ActivityIndicator size="large" color={cores.primaria} />
          <Text style={estilos.loadingTexto}>Carregando...</Text>
        </View>
      </View>
    )}
  </ScrollView>
);
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  headerPerfil: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingTop: 5,
  paddingBottom: 5,
  backgroundColor: cores.primaria,
  shadowColor: cores.sombra,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
  nomeUsuario: {
  fontSize: 18,
  fontWeight: 'bold',
  color: cores.branco,
  marginBottom: 2,
},
  emailUsuario: {
  fontSize: 14,
  color: cores.branco,
  opacity: 0.9,
},
  secaoEstatisticas: {
    margin: 20,
  },
  secaoInformacoes: {
    margin: 20,
  },
  secaoBotoes: {
    margin: 20,
    marginBottom: 40,
  },
  tituloSecao: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 15,
  },
  cardEstatistica: {
    backgroundColor: cores.fundoCartao,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },
  itemEstatistica: {
    alignItems: 'center',
  },
  numeroEstatistica: {
    fontSize: 28,
    fontWeight: 'bold',
    color: cores.primaria,
    marginBottom: 5,
  },
  labelEstatistica: {
    fontSize: 12,
    color: cores.textoSecundario,
    textAlign: 'center',
  },
  cardInformacoes: {
    backgroundColor: cores.fundoCartao,
    borderRadius: 12,
    padding: 20,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInformacao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  labelInformacao: {
    fontSize: 16,
    fontWeight: '600',
    color: cores.texto,
  },
  valorInformacao: {
    fontSize: 16,
    color: cores.textoSecundario,
    flex: 1,
    textAlign: 'right',
  },
  botaoAcao: {
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
  textoBotaoAcao: {
    fontSize: 18,
    color: cores.texto,
    fontWeight: '600',
  },
  avatarContainer: {
  marginRight: 15,
},
  botaoSair: {
    backgroundColor: cores.perigo,
    padding: 18,
    borderRadius: 12,
    marginTop: 10,
  },
  textoBotaoSair: {
    fontSize: 18,
    color: cores.branco,
    fontWeight: '600',
    textAlign: 'center',
  },
  valorComIcone: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  iconeEditar: {
    marginLeft: 10,
    padding: 5,
  },
  textoIconeEditar: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: cores.branco,
    borderRadius: 15,
    padding: 25,
    width: '85%',
    maxWidth: 400,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cores.texto,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: cores.fundoInput || cores.branco,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: cores.texto,
    marginBottom: 20,
  },
  modalBotoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  botaoModalCancelar: {
    backgroundColor: cores.textoSecundario,
    borderRadius: 8,
    padding: 15,
    flex: 1,
  },
  textoBotaoModalCancelar: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  botaoModalConfirmar: {
    backgroundColor: cores.primaria,
    borderRadius: 8,
    padding: 15,
    flex: 1,
  },
  textoBotaoModalConfirmar: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSubtitulo: {
    fontSize: 14,
    color: cores.textoSecundario,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: cores.branco,
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  loadingTexto: {
    marginTop: 15,
    fontSize: 16,
    color: cores.texto,
    fontWeight: '600',
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  // Novos estilos para o header igual ao Principal
areaUsuario: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  paddingVertical: 5,
  paddingRight: 10,
},
avatarCirculo: {
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
});
