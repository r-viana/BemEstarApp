
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { cores } from '../../utils/Cores';
import ItemAtividade from '../components/ItemAtividade';

// Dados de exemplo
const DADOS_EXEMPLO = [
  { id: '1', tipo: 'Corrida', icone: '🏃‍♂️', data: '06/07/2025', detalhes: '5 km em 30 min' },
  { id: '2', tipo: 'Musculação', icone: '🏋️‍♀️', data: '05/07/2025', detalhes: 'Treino de peito e tríceps' },
  { id: '3', tipo: 'Meditação', icone: '🧘', data: '05/07/2025', detalhes: '10 min de mindfulness' },
  { id: '4', tipo: 'Leitura', icone: '📚', data: '04/07/2025', detalhes: 'Capítulo 3 do livro' },
  { id: '5', tipo: 'Caminhada', icone: '🚶‍♀️', data: '03/07/2025', detalhes: '30 min no parque' },
];

export default function HistoricoDeAtividades() {
  const [atividades, setAtividades] = useState(DADOS_EXEMPLO);


  const handleEdit = (id) => {
    Alert.alert('Editar', `Função para editar a atividade com ID: ${id}`);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta atividade?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            // {/*Filtra a lista, mantendo apenas as atividades com ID diferente do que foi clicado*/}
            const novaLista = atividades.filter(item => item.id !== id);
            setAtividades(novaLista);
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    
    <ItemAtividade 
      item={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );

  return (
    <View style={estilos.container}>
      <FlatList
        data={atividades}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        
        ListEmptyComponent={() => (
          <View style={estilos.listaVaziaContainer}>
            <Text style={estilos.listaVaziaTexto}>Nenhuma atividade registrada ainda. 📝</Text>
          </View>
        )}
        contentContainerStyle={{ paddingTop: 10 }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  listaVaziaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  listaVaziaTexto: {
    fontSize: 16,
    color: cores.textoSecundario,
  },
});
