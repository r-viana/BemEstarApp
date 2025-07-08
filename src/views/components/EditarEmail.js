import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { cores } from '../../utils/Cores';
import { auth } from '../../services/FirebaseConfig';
import { EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail } from 'firebase/auth';

export default function EditarEmail({ visivel, emailAtual, fecharModal, onSucesso, onLogout }) {
  const [carregando, setCarregando] = useState(false);
  const [modalEdicao, setModalEdicao] = useState({ visivel: false, tipo: '', valor: '' });
  const [modalSenha, setModalSenha] = useState({ visivel: false, senha: '' });

  // Sincroniza a visibilidade externa com o estado interno do modal de edição de email
  // e define o valor inicial do email
  React.useEffect(() => {
    if (visivel) {
      setModalEdicao({ visivel: true, tipo: 'email', valor: emailAtual });
    } else {
      setModalEdicao({ visivel: false, tipo: '', valor: '' });
      setModalSenha({ visivel: false, senha: '' }); // Resetar modal de senha ao fechar
    }
  }, [visivel, emailAtual]);

  const fecharModalEdicaoInterno = () => {
    setModalEdicao({ visivel: false, tipo: '', valor: '' });
    fecharModal(); // Chama a função para fechar o modal no componente pai
  };

  const confirmarEdicao = async () => {
    console.log('confirmarEdicao chamada em EditarEmail');
    console.log('Modal tipo:', modalEdicao.tipo);
    console.log('Modal valor:', modalEdicao.valor);

    if (modalEdicao.tipo === 'email') {
      console.log('Tentando salvar email...');
      await salvarNovoEmail();
    }
  };

  const salvarNovoEmail = async () => {
    console.log('salvarNovoEmail chamada em EditarEmail');
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

    // Verifica se o novo email é diferente do atual
    if (modalEdicao.valor.trim() === emailAtual) {
      Alert.alert('Atenção', 'O novo email é o mesmo que o atual.');
      fecharModalEdicaoInterno();
      return;
    }

    console.log('Email válido, abrindo modal de senha...');
    setModalSenha({ visivel: true, senha: '' });
  };

  const confirmarAlteracaoEmail = async (senha) => {
    console.log('confirmarAlteracaoEmail chamada em EditarEmail');
    console.log('Senha recebida:', senha ? 'Sim' : 'Não');

    if (!senha) {
      console.log('Erro: senha não fornecida');
      Alert.alert('Erro', 'Senha é obrigatória');
      return;
    }
    setCarregando(true); // Ativa o carregamento no componente pai

    try {
      console.log('Tentando re-autenticar...');
      const usuario = auth.currentUser;
      const credential = EmailAuthProvider.credential(usuario.email, senha);
      await reauthenticateWithCredential(usuario, credential);

      console.log('Re-autenticação bem-sucedida, enviando verificação do novo email...');
      await verifyBeforeUpdateEmail(usuario, modalEdicao.valor.trim());

      console.log('Email de verificação enviado com sucesso!');

      fecharModalEdicaoInterno(); // Fecha o modal de edição de email
      fecharModalSenha(); // Fecha o modal de senha

      Alert.alert(
        'Verificação Enviada!',
        `Um email de verificação foi enviado para ${modalEdicao.valor}. Clique no link do email para confirmar a alteração.\n\nVocê será deslogado para fazer login com o novo email.`,
        [{
          text: 'OK',
          onPress: () => {
            console.log('Fazendo logout automático...');
            onLogout(); // Chama a função de logout do componente pai
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
      } else if (error.code === 'auth/requires-recent-login') {
        mensagemErro = 'Esta operação requer uma reautenticação recente. Faça login novamente e tente de novo.';
      }

      Alert.alert('Erro', mensagemErro);
    } finally {
      setCarregando(false); // Desativa o carregamento no componente pai
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
  };

  return (
    <>
      {/* Modal de Edição de Email Principal */}
      <Modal
        visible={modalEdicao.visivel && modalEdicao.tipo === 'email' && !modalSenha.visivel}
        transparent={true}
        animationType="slide"
        onRequestClose={fecharModalEdicaoInterno}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContainer}>
            <Text style={estilos.modalTitulo}>Editar Email</Text>
            <TextInput
              style={estilos.modalInput}
              value={modalEdicao.valor}
              onChangeText={(texto) => setModalEdicao(prev => ({ ...prev, valor: texto }))}
              placeholder="Novo email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus={true}
              editable={!carregando}
            />
            <View style={estilos.modalBotoes}>
              <TouchableOpacity
                style={[estilos.botaoModalCancelar, carregando && estilos.botaoDesabilitado]}
                onPress={fecharModalEdicaoInterno}
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
    </>
  );
}

const estilos = StyleSheet.create({
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
  botaoDesabilitado: {
    opacity: 0.6,
  },
});
