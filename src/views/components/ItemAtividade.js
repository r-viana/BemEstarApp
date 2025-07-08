import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { cores } from '../../utils/Cores';

export default function ItemAtividade({ item, onEdit, onDelete, onView }) {
  return (
    <TouchableOpacity 
      style={estilos.itemContainer}
      onPress={() => onView && onView(item.id)}
      activeOpacity={0.7}
    >
      <View style={estilos.conteudoPrincipal}>
        {/* Ícone */}
        <View style={estilos.areaIcone}>
          <Text style={estilos.icone}>{item.icone}</Text>
        </View>

        {/* Área de Texto */}
        <View style={estilos.areaTexto}>
          <Text style={estilos.textoTipo}>{item.tipo}</Text>
          <Text style={estilos.textoDetalhes}>{item.detalhes}</Text>
          <Text style={estilos.textoAmbiente}>{item.ambiente}</Text>
          <Text style={estilos.textoLocal}>{item.local}</Text>
          <Text style={estilos.textoData}>{item.data}</Text>
        </View>

        {/* Botões (Editar/Excluir) */}
        <View style={estilos.areaBotoes}>
          <TouchableOpacity 
            style={estilos.botaoAcao} 
            onPress={(e) => {
              e.stopPropagation(); // Evita disparar onView
              onEdit(item.id);
            }}
          >
            <Text style={estilos.iconeBotao}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={estilos.botaoAcao} 
            onPress={(e) => {
              e.stopPropagation(); // Evita disparar onView
              onDelete(item.id);
            }}
          >
            <Text style={estilos.iconeBotao}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
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
    borderLeftWidth: 4,
    borderLeftColor: cores.primaria,
  },
  conteudoPrincipal: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Alinhamento no topo para melhor layout
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
    flex: 1,
    paddingRight: 10, // Espaço para os botões
  },
  textoTipo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 4,
  },
  textoDetalhes: {
    fontSize: 14,
    color: cores.textoSecundario,
    marginBottom: 4,
  },
  textoAmbiente: {
    fontSize: 14,
    color: cores.primaria,
    fontWeight: '600',
    marginBottom: 4,
  },
  textoLocal: {
    fontSize: 14,
    color: cores.texto,
    fontWeight: '500',
    marginBottom: 4,
  },
  textoData: {
    fontSize: 12,
    color: cores.textoSecundario,
    fontStyle: 'italic',
  },
  areaBotoes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  botaoAcao: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  iconeBotao: {
    fontSize: 18,
  },
});