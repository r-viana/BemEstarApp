import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { cores } from '../../utils/Cores';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { auth, firestore } from '../../services/FirebaseConfig';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';



export default function Cadastro({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

const fazerCadastro = async () => {
  console.log('=== INÍCIO DO CADASTRO ===');
  console.log('1. Dados recebidos:', { nome, email, senha, confirmarSenha });

  // Validação 
  if (!nome || !email || !senha || !confirmarSenha) {
    console.log('2. Erro: Campos vazios');
    Alert.alert('Erro', 'Por favor, preencha todos os campos');
    return;
  }
  console.log('2. Validação de campos OK');

  if (senha !== confirmarSenha) {
    console.log('3. Erro: Senhas não coincidem');
    Alert.alert('Erro', 'As senhas não coincidem');
    return;
  }
  console.log('3. Validação de senhas OK');

  if (senha.length < 6) {
    console.log('4. Erro: Senha muito curta');
    Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
    return;
  }
  console.log('4. Validação de tamanho OK');

  try {
    console.log('5. Criando usuário no Firebase Auth...');
    
    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    console.log('6. Usuário criado:', userCredential.user.uid);
    
    // Adicionar nome ao perfil
    await updateProfile(userCredential.user, {
      displayName: nome
    });
    console.log('7. Nome adicionado ao perfil');

    // Salvar dados no Firestore
    console.log('8. Salvando dados no Firestore...');
      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
      email: email,
      nome: nome,
      criadoEm: new Date(),
      verificado: false
});

    console.log('9. Dados salvos no Firestore');

    // Enviar email de verificação
    console.log('10. Enviando email de verificação...');
    await sendEmailVerification(userCredential.user);
    console.log('11. Email enviado com sucesso');

    // Navegar para tela de verificação
    navigation.navigate('VerificarEmail', { 
      email: email,
      nome: nome 
    });

  } catch (error) {
    console.log('=== ERRO CAPTURADO ===');
    console.log('Erro completo:', error);
    console.log('Código do erro:', error.code);
    console.log('Mensagem do erro:', error.message);
    
    let mensagemErro = 'Erro ao criar conta';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        mensagemErro = 'Este email já está em uso';
        break;
      case 'auth/invalid-email':
        mensagemErro = 'Email inválido';
        break;
      case 'auth/weak-password':
        mensagemErro = 'A senha deve ter pelo menos 6 caracteres';
        break;
      default:
        mensagemErro = 'Erro ao criar conta: ' + error.message;
    }
    
    Alert.alert('Erro', mensagemErro);
  }
};



  return (
    <View style={estilos.container}>
      <Text style={estilos.titulo}>Criar Conta</Text>
      
      <TextInput
        style={estilos.input}
        placeholder="Nome completo"
        value={nome}
        onChangeText={setNome}
        autoCapitalize="words"
      />
      
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
      
      <TextInput
        style={estilos.input}
        placeholder="Confirmar senha"
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
        secureTextEntry
      />
      
      <TouchableOpacity style={estilos.botao} onPress={fazerCadastro}>
        <Text style={estilos.textoBotao}>Cadastrar</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={estilos.linkVoltar}>Já tem conta? Fazer login</Text>
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
    backgroundColor: cores.secundaria,
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
  linkVoltar: {
    textAlign: 'center',
    marginTop: 20,
    color: cores.primaria,
    fontSize: 16,
  },
});




