import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { cores } from '../utils/cores';


export default function Principal({ navigation }) {
  const fazerLogout = () => {
    Alert.alert(
      'Logout',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: () => {
            // Aqui implementaremos a lógica de logout
            console.log('Fazendo logout...');
          }
        }
      ]
    );
  };

  return (
    <View style={estilos.container}>
      <Text style={estilos.titulo}>Bem-vindo ao Bem Estar App!</Text>
      
      <View style={estilos.conteudo}>
        <Text style={estilos.subtitulo}>Painel Principal</Text>
        
        <View style={estilos.cartao}>
          <Text style={estilos.textoCartao}>
            Você está logado com sucesso!
          </Text>
          <Text style={estilos.descricaoCartao}>
            Aqui vamos adicionar as funcionalidades do seu app.
          </Text>
        </View>
        
        <TouchableOpacity style={estilos.botaoSecundario}>
          <Text style={estilos.textoBotaoSecundario}>Meu Perfil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={estilos.botaoSecundario}>
          <Text style={estilos.textoBotaoSecundario}>Configurações</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={estilos.botaoLogout} onPress={fazerLogout}>
        <Text style={estilos.textoBotaoLogout}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
    padding: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 30,
    color: cores.texto,
  },
  conteudo: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitulo: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: cores.texto,
  },
  cartao: {
    backgroundColor: cores.fundoCartao,
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },
  textoCartao: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: cores.texto,
  },
  descricaoCartao: {
    fontSize: 16,
    color: cores.textoSecundario,
    lineHeight: 22,
  },
  botaoSecundario: {
    backgroundColor: cores.primaria,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  textoBotaoSecundario: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: '600',
  },
  botaoLogout: {
    backgroundColor: cores.perigo,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  textoBotaoLogout: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
