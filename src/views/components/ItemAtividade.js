import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { cores } from '../../utils/Cores';

export default function ItemAtividade({ item, onEdit, onDelete }) {
  return (
    <View style={estilos.itemContainer}>
      <View style={estilos.conteudoPrincipal}>

        {/*Ícone*/}

        <View style={estilos.areaIcone}>
          <Text style={estilos.icone}>{item.icone}</Text>
        </View>

        {/*Área de Texto*/}
        <View style={estilos.areaTexto}>
          <Text style={estilos.textoTipo}>{item.tipo}</Text>
          <Text style={estilos.textoDetalhes}>{item.detalhes}</Text>
          <Text style={estilos.textoData}>{item.data}</Text>
        </View>

        {/*Botões(Editar/Excluir)*/}
        <View style={estilos.areaBotoes}>
          <TouchableOpacity style={estilos.botaoAcao} onPress={() => onEdit(item.id)}>
            <Text style={estilos.iconeBotao}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.botaoAcao} onPress={() => onDelete(item.id)}>
            <Text style={estilos.iconeBotao}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  itemContainer: {
    backgroundColor: cores.fundoCartao,
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },
  conteudoPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  areaIcone: {
    backgroundColor: '#E9E9E9',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  icone: {
    fontSize: 24,
  },
  areaTexto: {
    flex: 1, // {/*espaço disponível*/}
  },
  textoTipo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.texto,
  },
  textoDetalhes: {
    fontSize: 14,
    color: cores.textoSecundario,
    marginTop: 2,
  },
  textoData: {
    fontSize: 12,
    color: cores.textoSecundario,
    marginTop: 4,
  },
  areaBotoes: {
    flexDirection: 'row',
  },
  botaoAcao: {
    padding: 8,
    marginLeft: 8,
  },
  iconeBotao: {
    fontSize: 20,
  },
});
