import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { cores } from '../../utils/Cores';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/FirebaseConfig';

export default function RecuperarSenha({ navigation }) {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviarEmailRecuperacao = async () => {
    // Validação de campo de e-mail vazio
    if (!email) {
      alert('Por favor, digite seu email');
      return;
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Por favor, digite um email válido');
      return;
    }

    try {
      setEnviando(true);
      
      // Enviar email de recuperação
      await sendPasswordResetEmail(auth, email);
      
      Alert.alert(
        'Solicitação enviada!',
        'Se este email estiver cadastrado em nossa base, você receberá as instruções de recuperação em alguns minutos.',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );


    } catch (error) {
      console.log('Erro ao enviar email:', error);
      
      let mensagemErro = 'Erro ao enviar email de recuperação';
      
      switch (error.code) {
        case 'auth/user-not-found':
          mensagemErro = 'Não encontramos uma conta com este email';
          break;
        case 'auth/invalid-email':
          mensagemErro = 'Email inválido';
          break;
        case 'auth/too-many-requests':
          mensagemErro = 'Muitas tentativas. Tente novamente mais tarde';
          break;
        default:
          mensagemErro = 'Erro ao enviar email: ' + error.message;
      }
      
      alert(mensagemErro);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={estilos.container}>
      <Text style={estilos.titulo}>Recuperar Senha</Text>
      
      <Text style={estilos.descricao}>
        Digite seu email para receber as instruções de recuperação de senha.
        {'\n\n'}
        Você receberá um email apenas se esta conta existir em nossa base de dados.
      </Text>

      
      <TextInput
        style={estilos.input}
        placeholder="Digite seu email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!enviando}
      />
      
      <TouchableOpacity 
        style={[estilos.botao, enviando && estilos.botaoDesabilitado]} 
        onPress={enviarEmailRecuperacao}
        disabled={enviando}
      >
        <Text style={estilos.textoBotao}>
          {enviando ? 'Enviando...' : 'Enviar Email'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        disabled={enviando}
      >
        <Text style={estilos.linkVoltar}>Voltar ao login</Text>
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: cores.fundo,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: cores.texto,
  },
  descricao: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: cores.textoSecundario,
    lineHeight: 22,
  },
  input: {
    backgroundColor: cores.fundoInput,
    padding: 15,
    marginBottom: 20,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    color: cores.texto,
  },
  botao: {
    backgroundColor: cores.primaria,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  botaoDesabilitado: {
    backgroundColor: cores.cinza,
    opacity: 0.7,
  },
  textoBotao: {
    color: cores.branco,
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkVoltar: {
    textAlign: 'center',
    color: cores.primaria,
    fontSize: 16,
  },
});
