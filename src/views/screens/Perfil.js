import EditarNome from '../components/EditarNome';

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { cores } from '../../utils/Cores';
import { auth } from '../../services/FirebaseConfig';
import { signOut, updateProfile, reauthenticateWithCredential, 
  EmailAuthProvider, updateEmail, sendEmailVerification, 
verifyBeforeUpdateEmail, updatePassword } from 'firebase/auth';


export default function Perfil({ navigation }) {
  const [carregando, setCarregando] = useState(false);
  const [editandoNome, setEditandoNome] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [editandoEmail, setEditandoEmail] = useState(false);
  const [novoEmail, setNovoEmail] = useState('');
  const [modalEdicao, setModalEdicao] = useState({ visivel: false, tipo: '', valor: '' });
  const [modalSenha, setModalSenha] = useState({ visivel: false, senha: '' });
  const [modalAlterarSenha, setModalAlterarSenha] = useState({ 
    visivel: false, 
    etapa: 'confirmar', // 'confirmar' ou 'nova'
    senhaAtual: '', 
    novaSenha: '', 
    confirmarNovaSenha: '' 
});


const [dadosUsuario, setDadosUsuario] = useState({
  nome: '',
  email: '',
  dataCadastro: '',
  diasConsecutivos: 0,
  recordeDias: 0,
  totalAtividades: 0
});


  useEffect(() => {
    carregarDadosUsuario();
  }, []);


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

const abrirModalEdicao = (tipo, valorAtual) => {
  setModalEdicao({
    visivel: true,
    tipo: tipo,
    valor: valorAtual
  });
};

const fecharModalEdicao = () => {
  setModalEdicao({ visivel: false, tipo: '', valor: '' });
};

const confirmarEdicao = async () => {
  console.log('confirmarEdicao chamada');
  console.log('Modal tipo:', modalEdicao.tipo);
  console.log('Modal valor:', modalEdicao.valor);
  
  if (modalEdicao.tipo === 'nome') {
    console.log('Tentando salvar nome...');
    await salvarNovoNome();
  } else if (modalEdicao.tipo === 'email') {
    console.log('Tentando salvar email...');
    await salvarNovoEmail();
  }
};

const salvarNovoNome = async () => {
  console.log('salvarNovoNome chamada');
  console.log('Valor para salvar:', modalEdicao.valor);
  
  if (!modalEdicao.valor.trim()) {
    console.log('Erro: nome vazio');
    Alert.alert('Erro', 'Nome não pode estar vazio');
    return;
  }

  setCarregando(true);

  try {
    console.log('Tentando atualizar perfil...');
    await updateProfile(auth.currentUser, {
      displayName: modalEdicao.valor.trim()
    });
    
    console.log('Perfil atualizado, atualizando estado...');
    setDadosUsuario(prev => ({
      ...prev,
      nome: modalEdicao.valor.trim()
    }));
    
    console.log('Fechando modal...');
    fecharModalEdicao();
    
    console.log('Mostrando alerta de sucesso...');
    Alert.alert('Sucesso', 'Nome atualizado com sucesso!');
  } catch (error) {
    console.log('Erro ao salvar nome:', error);
    Alert.alert('Erro', 'Não foi possível atualizar o nome');
  } finally{
      setCarregando(false);
  }
};

const salvarNovoEmail = async () => {
  console.log('salvarNovoEmail chamada');
  console.log('Valor para salvar:', modalEdicao.valor);
  
  if (!modalEdicao.valor.trim()) {
    console.log('Erro: email vazio');
    Alert.alert('Erro', 'Email não pode estar vazio');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(modalEdicao.valor.trim())) {
    console.log('Erro: email inválido');
    Alert.alert('Erro', 'Email inválido');
    return;
  }

  console.log('Email válido, abrindo modal de senha...');
  setModalSenha({ visivel: true, senha: '' });
};

const confirmarAlteracaoEmail = async (senha) => {
  console.log('confirmarAlteracaoEmail chamada');
  console.log('Senha recebida:', senha ? 'Sim' : 'Não');
  
  if (!senha) {
    console.log('Erro: senha não fornecida');
    Alert.alert('Erro', 'Senha é obrigatória');
    return;
  }
    setCarregando(true);

  try {
    console.log('Tentando re-autenticar...');
    const usuario = auth.currentUser;
    const credential = EmailAuthProvider.credential(usuario.email, senha);
    await reauthenticateWithCredential(usuario, credential);
    
    console.log('Re-autenticação bem-sucedida, enviando verificação do novo email...');
    await verifyBeforeUpdateEmail(usuario, modalEdicao.valor.trim());
    
    console.log('Email de verificação enviado com sucesso!');
    
    fecharModalEdicao();
    
    Alert.alert(
      'Verificação Enviada!', 
      `Um email de verificação foi enviado para ${modalEdicao.valor}. Clique no link do email para confirmar a alteração.\n\nVocê será deslogado para fazer login com o novo email.`,
      [{ 
        text: 'OK', 
        onPress: () => {
          console.log('Fazendo logout automático...');
          fazerLogout();
        }
      }]
    );
    
  } catch (error) {
    console.log('Erro ao alterar email:', error);
    console.log('Código do erro:', error.code);
    
    let mensagemErro = 'Não foi possível atualizar o email';
    
    if (error.code === 'auth/wrong-password') {
      mensagemErro = 'Senha incorreta';
    } else if (error.code === 'auth/email-already-in-use') {
      mensagemErro = 'Este email já está em uso';
    } else if (error.code === 'auth/invalid-login-credentials') {
      mensagemErro = 'Credenciais inválidas';
    } else if (error.code === 'auth/operation-not-allowed') {
      mensagemErro = 'Operação não permitida pelo Firebase';
    }
    
    Alert.alert('Erro', mensagemErro);
  }finally{
      setCarregando(false);
  }
};

const fecharModalSenha = () => {
  setModalSenha({ visivel: false, senha: '' });
};

const confirmarSenha = async () => {
  console.log('Confirmando senha para alteração de email...');
  
  if (!modalSenha.senha.trim()) {
    Alert.alert('Erro', 'Digite sua senha');
    return;
  }

  await confirmarAlteracaoEmail(modalSenha.senha);
  fecharModalSenha();
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
    {/* Header do Perfil */}
    <View style={estilos.headerPerfil}>
      <View style={estilos.avatarContainer}>
        <Text style={estilos.avatar}>👤</Text>
      </View>
      <Text style={estilos.nomeUsuario}>{dadosUsuario.nome}</Text>
      <Text style={estilos.emailUsuario}>{dadosUsuario.email}</Text>
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
              onPress={() => abrirModalEdicao('nome', dadosUsuario.nome)}
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
              onPress={() => abrirModalEdicao('email', dadosUsuario.email)}
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
    
    {/* Modal de Edição (Nome/Email) */}
    <Modal
      visible={modalEdicao.visivel}
      transparent={true}
      animationType="slide"
      onRequestClose={fecharModalEdicao}
    >
      <View style={estilos.modalOverlay}>
        <View style={estilos.modalContainer}>
          <Text style={estilos.modalTitulo}>
            {modalEdicao.tipo === 'nome' ? 'Editar Nome' : 'Editar Email'}
          </Text>
          
          <TextInput
            style={estilos.modalInput}
            value={modalEdicao.valor}
            onChangeText={(texto) => setModalEdicao(prev => ({ ...prev, valor: texto }))}
            placeholder={modalEdicao.tipo === 'nome' ? 'Digite o novo nome' : 'Digite o novo email'}
            keyboardType={modalEdicao.tipo === 'email' ? 'email-address' : 'default'}
            autoFocus={true}
            editable={!carregando}
          />
          
          <View style={estilos.modalBotoes}>
            <TouchableOpacity 
              style={[estilos.botaoModalCancelar, carregando && estilos.botaoDesabilitado]}
              onPress={fecharModalEdicao}
              disabled={carregando}
            >
              <Text style={estilos.textoBotaoModalCancelar}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[estilos.botaoModalConfirmar, carregando && estilos.botaoDesabilitado]}
              onPress={confirmarEdicao}
              disabled={carregando}
            >
              {carregando ? (
                <ActivityIndicator size="small" color={cores.branco} />
              ) : (
                <Text style={estilos.textoBotaoModalConfirmar}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    {/* Modal de Confirmação de Senha para Email */}
    <Modal
      visible={modalSenha.visivel}
      transparent={true}
      animationType="slide"
      onRequestClose={fecharModalSenha}
    >
      <View style={estilos.modalOverlay}>
        <View style={estilos.modalContainer}>
          <Text style={estilos.modalTitulo}>Confirme sua senha</Text>
          <Text style={estilos.modalSubtitulo}>
            Para alterar o email, digite sua senha atual:
          </Text>
          
          <TextInput
            style={estilos.modalInput}
            value={modalSenha.senha}
            onChangeText={(senha) => setModalSenha(prev => ({ ...prev, senha }))}
            placeholder="Digite sua senha atual"
            secureTextEntry={true}
            autoFocus={true}
            editable={!carregando}
          />
          
          <View style={estilos.modalBotoes}>
            <TouchableOpacity 
              style={[estilos.botaoModalCancelar, carregando && estilos.botaoDesabilitado]}
              onPress={fecharModalSenha}
              disabled={carregando}
            >
              <Text style={estilos.textoBotaoModalCancelar}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[estilos.botaoModalConfirmar, carregando && estilos.botaoDesabilitado]}
              onPress={confirmarSenha}
              disabled={carregando}
            >
              {carregando ? (
                <ActivityIndicator size="small" color={cores.branco} />
              ) : (
                <Text style={estilos.textoBotaoModalConfirmar}>Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

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
    backgroundColor: cores.primaria,
    padding: 30,
    alignItems: 'center',
    paddingTop: 60,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: cores.branco,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    fontSize: 40,
  },
  nomeUsuario: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cores.branco,
    marginBottom: 5,
  },
  emailUsuario: {
    fontSize: 16,
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
});
