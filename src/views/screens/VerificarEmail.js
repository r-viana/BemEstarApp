import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { cores } from '../../utils/Cores';
import { auth } from '../../services/FirebaseConfig';
import { sendEmailVerification } from 'firebase/auth';

export default function VerificarEmail({ route, navigation }) {
  const { email, nome } = route.params;
  const [verificando, setVerificando] = useState(false);

  const verificarEmail = async () => {
    try {
      setVerificando(true);
      
      // Recarrega as informações
      //sem isso aqui o app fica com as informações desatualizadas em cache
      //depois do reload ele busca no servidor a informação atual
      await auth.currentUser.reload();
      
      if (auth.currentUser.emailVerified) {
        Alert.alert('Sucesso', 'Email verificado com sucesso!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('Aviso', 'Email ainda não foi verificado. Verifique sua caixa de entrada.');
      }
    } catch (error) {
      console.log('Erro ao verificar:', error);
      Alert.alert('Erro', 'Erro ao verificar email');
    } finally {
      setVerificando(false);
    }
  };

  const reenviarEmail = async () => {
    try {
      await sendEmailVerification(auth.currentUser);
      Alert.alert('Sucesso', 'Email de verificação reenviado!');
    } catch (error) {
      console.log('Erro ao reenviar:', error);
      Alert.alert('Erro', 'Erro ao reenviar email');
    }
  };

  return (
    <View style={estilos.container}>
      <Text style={estilos.titulo}>Verificar Email</Text>
      
      <Text style={estilos.texto}>
        Olá, {nome}!
      </Text>
      
      <Text style={estilos.texto}>
        Enviamos um email de verificação para:
      </Text>
      
      <Text style={estilos.email}>{email}</Text>
      
      <Text style={estilos.instrucoes}>
        Clique no link do email para verificar sua conta e depois clique no botão abaixo.
      </Text>
      
      <TouchableOpacity 
        style={estilos.botao} 
        onPress={verificarEmail}
        disabled={verificando}
      >
        <Text style={estilos.textoBotao}>
          {verificando ? 'Verificando...' : 'Já verifiquei'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={estilos.botaoSecundario} onPress={reenviarEmail}>
        <Text style={estilos.textoBotaoSecundario}>Reenviar email</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
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
    marginBottom: 30,
    color: cores.texto,
  },
  texto: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: cores.texto,
  },
  email: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: cores.primaria,
    fontWeight: 'bold',
  },
  instrucoes: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    color: cores.textoSecundario,
    lineHeight: 20,
  },
  botao: {
    backgroundColor: cores.secundaria,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  textoBotao: {
    color: cores.branco,
    fontSize: 18,
    fontWeight: 'bold',
  },
  botaoSecundario: {
    backgroundColor: cores.primaria,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  textoBotaoSecundario: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkVoltar: {
    textAlign: 'center',
    color: cores.primaria,
    fontSize: 16,
  },
});
