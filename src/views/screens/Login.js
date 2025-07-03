import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { cores } from '../../utils/Cores';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const fazerLogin = () => {
    // login
    console.log('Email:', email);
    console.log('Senha:', senha);
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
