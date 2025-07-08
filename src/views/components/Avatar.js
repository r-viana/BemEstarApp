import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { cores } from '../../utils/Cores';

const Avatar = ({ 
  fotoUri, 
  iniciais, 
  corFundo, 
  tamanho = 60, 
  editavel = false, 
  onPress 
}) => {
  const estilos = criarEstilos(tamanho, corFundo);

  const renderConteudo = () => {
    if (fotoUri) {
      // Mostrar foto do usuário
      return (
        <Image 
          source={{ uri: fotoUri }} 
          style={estilos.foto}
          onError={(error) => {
            console.log('Erro ao carregar foto do avatar:', error);
            // Em caso de erro, poderia fallback para iniciais
          }}
        />
      );
    } else {
      // Mostrar iniciais com cor de fundo
      return (
        <View style={estilos.containerIniciais}>
          <Text style={estilos.textoIniciais}>{iniciais}</Text>
        </View>
      );
    }
  };

  if (editavel && onPress) {
    return (
      <TouchableOpacity 
        style={estilos.containerEditavel} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {renderConteudo()}
        <View style={estilos.indicadorEdicao}>
          <Text style={estilos.iconeEdicao}>📷</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={estilos.container}>
      {renderConteudo()}
    </View>
  );
};

const criarEstilos = (tamanho, corFundo) => StyleSheet.create({
  container: {
    width: tamanho,
    height: tamanho,
    borderRadius: tamanho / 2,
    overflow: 'hidden',
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  containerEditavel: {
    width: tamanho,
    height: tamanho,
    borderRadius: tamanho / 2,
    overflow: 'visible', // Para mostrar indicador de edição
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  foto: {
    width: tamanho,
    height: tamanho,
    borderRadius: tamanho / 2,
  },
  containerIniciais: {
    width: tamanho,
    height: tamanho,
    borderRadius: tamanho / 2,
    backgroundColor: corFundo,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: cores.branco,
  },
  textoIniciais: {
    fontSize: tamanho * 0.4, // 40% do tamanho do avatar
    fontWeight: 'bold',
    color: cores.branco,
    textAlign: 'center',
  },
  indicadorEdicao: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: cores.primaria,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: cores.branco,
  },
  iconeEdicao: {
    fontSize: 10,
  },
});

export default Avatar;