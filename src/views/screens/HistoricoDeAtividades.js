import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { cores } from '../../utils/Cores';
import ItemAtividade from '../components/ItemAtividade';
import ModalDetalhesAtividade from '../components/ModalDetalhesAtividade';
import { 
  buscarAtividadesDoUsuario, 
  excluirAtividade, 
  formatarAtividadeParaExibicao 
} from '../../services/AtividadeService';

export default function HistoricoDeAtividades({ navigation }) {
  const [atividades, setAtividades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [excluindo, setExcluindo] = useState(null); // ID da atividade sendo excluída
  const [modalDetalhes, setModalDetalhes] = useState({
    visivel: false,
    atividade: null
  });

  // Carregar atividades quando a tela ganhar foco
  useFocusEffect(
    React.useCallback(() => {
      carregarAtividades();
    }, [])
  );

  const carregarAtividades = async () => {
    try {
      setCarregando(true);
      console.log('Carregando atividades do Firebase...');
      
      const atividadesDoFirebase = await buscarAtividadesDoUsuario();
      console.log('Atividades encontradas:', atividadesDoFirebase.length);
      
      // Formatar atividades para exibição
      const atividadesFormatadas = atividadesDoFirebase.map(atividade => 
        formatarAtividadeParaExibicao(atividade)
      );
      
      setAtividades(atividadesFormatadas);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      Alert.alert(
        'Erro', 
        'Não foi possível carregar as atividades. Verifique sua conexão.'
      );
    } finally {
      setCarregando(false);
    }
  };

  const handleView = (id) => {
    const atividade = atividades.find(item => item.id === id);
    if (atividade) {
      setModalDetalhes({
        visivel: true,
        atividade: atividade
      });
    }
  };

  const fecharModal = () => {
    setModalDetalhes({
      visivel: false,
      atividade: null
    });
  };

  const handleEdit = (id) => {
    // Encontrar a atividade pelos dados originais
    const atividade = atividades.find(item => item.id === id);
    if (atividade && atividade.dadosOriginais) {
      // Converter Date para string para evitar erro de serialização
      const dados = atividade.dadosOriginais;
      navigation.navigate('TelaFormularioDeAtividade', {
        initialValues: {
          id: atividade.id,
          type: dados.tipo,
          date: dados.data.toISOString(), // Converter para string
          durationMinutes: dados.duracaoMinutos,
          locationName: dados.local,
          isOutdoor: dados.isOutdoor,
          distanceKm: dados.distanciaKm,
          notes: dados.notas
        }
      });
    }
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
          onPress: () => confirmarExclusao(id),
        },
      ]
    );
  };

  const confirmarExclusao = async (id) => {
    try {
      setExcluindo(id);
      console.log('Excluindo atividade:', id);
      
      await excluirAtividade(id);
      
      // Remover da lista local
      const novaLista = atividades.filter(item => item.id !== id);
      setAtividades(novaLista);
      
      Alert.alert('Sucesso', 'Atividade excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir atividade:', error);
      Alert.alert('Erro', 'Não foi possível excluir a atividade.');
    } finally {
      setExcluindo(null);
    }
  };

  const handleNovaAtividade = () => {
    navigation.navigate('TelaFormularioDeAtividade');
  };

  const renderItem = ({ item }) => (
    <ItemAtividade 
      item={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
      excluindo={excluindo === item.id} // Passar estado de loading
    />
  );

  const renderListEmpty = () => {
    if (carregando) {
      return (
        <View style={estilos.loadingContainer}>
          <ActivityIndicator size="large" color={cores.primaria} />
          <Text style={estilos.loadingText}>Carregando atividades...</Text>
        </View>
      );
    }

    return (
      <View style={estilos.listaVaziaContainer}>
        <Text style={estilos.listaVaziaTexto}>📝</Text>
        <Text style={estilos.listaVaziaTitulo}>Nenhuma atividade registrada</Text>
        <Text style={estilos.listaVaziaSubtitulo}>
          Comece registrando sua primeira atividade!
        </Text>
        <TouchableOpacity 
          style={estilos.botaoNovaAtividadeVazio}
          onPress={handleNovaAtividade}
        >
          <Text style={estilos.textoBotaoNovaAtividadeVazio}>
            ➕ Registrar Atividade
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Função para atualizar a lista quando voltar do formulário
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Só recarregar se não estiver já carregando
      if (!carregando) {
        carregarAtividades();
      }
    });

    return unsubscribe;
  }, [navigation, carregando]);

  return (
    <View style={estilos.container}>
      <FlatList
        data={atividades}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderListEmpty}
        onRefresh={carregarAtividades} // Pull to refresh
        refreshing={carregando}
        contentContainerStyle={{ 
          paddingTop: 10,
          paddingBottom: 100, // Espaço para o FAB
          flexGrow: 1 
        }}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Floating Action Button (FAB) */}
      {!carregando && atividades.length > 0 && (
        <TouchableOpacity 
          style={estilos.fab}
          onPress={handleNovaAtividade}
          activeOpacity={0.8}
        >
          <Text style={estilos.fabIcon}>➕</Text>
        </TouchableOpacity>
      )}
      {/* Modal de Detalhes */}
      <ModalDetalhesAtividade
        visivel={modalDetalhes.visivel}
        atividade={modalDetalhes.atividade}
        onFechar={fecharModal}
        onEditar={handleEdit}
        onExcluir={handleDelete}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: cores.textoSecundario,
  },
  listaVaziaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  listaVaziaTexto: {
    fontSize: 48,
    marginBottom: 20,
  },
  listaVaziaTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cores.texto,
    textAlign: 'center',
    marginBottom: 10,
  },
  listaVaziaSubtitulo: {
    fontSize: 16,
    color: cores.textoSecundario,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  botaoNovaAtividadeVazio: {
    backgroundColor: cores.primaria,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  textoBotaoNovaAtividadeVazio: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: cores.primaria,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: cores.branco,
    fontWeight: 'bold',
  },
});