import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { cores } from '../../utils/Cores';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../services/FirebaseConfig';


export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

const fazerLogin = async () => {
  // Validação se ele preencheu todos os campos 
  if (!email || !senha) {
    Alert.alert('Erro', 'Por favor, preencha todos os campos');
    return;
  }

  try {
    // Fazer login no Firebase
    const resultado = await signInWithEmailAndPassword(auth, email, senha);
    
    // Verificar se email foi confirmado
    if (!resultado.user.emailVerified) {
      // Fazer logout imediatamente
      await auth.signOut();
      
      Alert.alert(
        'Email não verificado',
        'Você precisa verificar seu email antes de fazer login.',
        [
          { 
            text: 'Reenviar email', 
            onPress: () => reenviarEmailVerificacao(resultado.user) 
          },
          { text: 'OK' }
        ]
      );
      return;
    }
    
    // Aqui o email já foi verificado
    navigation.reset({
      index: 0,
      routes: [{ name: 'Principal' }],
    });

  } catch (error) {
    let mensagemErro = 'Erro ao fazer login';
    
    switch (error.code) {
      case 'auth/user-not-found':
        mensagemErro = 'Usuário não encontrado';
        break;
      case 'auth/wrong-password':
        mensagemErro = 'Senha incorreta';
        break;
      case 'auth/invalid-email':
        mensagemErro = 'Email inválido';
        break;
      case 'auth/too-many-requests':
        mensagemErro = 'Muitas tentativas. Tente novamente mais tarde';
        break;
      default:
        mensagemErro = 'Erro ao fazer login: ' + error.message;
    }
    
    Alert.alert('Erro', mensagemErro);
  }
};



  return (
    <View style={estilos.container}>
      <Text style={estilos.titulo}>Bem Estar App</Text>
      
      <TextInput
        style={estilos.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={estilos.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />
      
      <TouchableOpacity style={estilos.botao} onPress={fazerLogin}>
        <Text style={estilos.textoBotao}>Entrar</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
        <Text style={estilos.linkCadastro}>Não tem conta? Cadastre-se</Text>
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
    marginBottom: 40,
    color: cores.texto,
  },
  input: {
    backgroundColor: cores.fundoInput,
    padding: 15,
    marginBottom: 15,
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
    marginTop: 10,
  },
  textoBotao: {
    color: cores.branco,
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkCadastro: {
    textAlign: 'center',
    marginTop: 20,
    color: cores.primaria,
    fontSize: 16,
  },
});
