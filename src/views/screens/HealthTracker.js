import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { cores } from '../../utils/Cores';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  firestore, 
  COLLECTIONS, 
  getCurrentUser, 
  getUserId,
  onAuthStateChanged 
} from '../../services/FirebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function HealthTracker({ navigation }) {
  const [objetivos, setObjetivos] = useState([]);
  const [objetivosConcluidos, setObjetivosConcluidos] = useState([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [novoObjetivo, setNovoObjetivo] = useState('');
  const [tipoSelecionado, setTipoSelecionado] = useState('diario');

useEffect(() => {
  // Listener para mudanças no estado de autenticação
  const unsubscribe = onAuthStateChanged((user) => {
    if (user) {
      console.log('Usuário logado:', user.email);
      carregarObjetivos();
    } else {
      console.log('Usuário não logado');
      carregarDadosLocais();
    }
  });

  // Cleanup do listener
  return () => unsubscribe();
}, []);




const carregarObjetivos = async () => {
  try {
    const userId = getUserId();
    
    if (userId) {
      // Usuário logado - tenta carregar do Firebase
      await carregarDoFirebase();
    } else {
      // Usuário não logado - carrega dados locais
      await carregarDadosLocais();
    }
  } catch (error) {
    console.log('Erro ao carregar objetivos:', error);
    // Em caso de erro, carrega dados locais como fallback
    await carregarDadosLocais();
  }
};

const carregarDoFirebase = async () => {
  try {
    const userId = getUserId();
    const userDocRef = doc(firestore, COLLECTIONS.USERS, userId);
    const docSnap = await getDoc(userDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      setObjetivos(data.objetivos || []);
      setObjetivosConcluidos(data.objetivosConcluidos || []);
      
      // Salva localmente para funcionar offline
      await AsyncStorage.setItem('objetivos', JSON.stringify(data.objetivos || []));
      await AsyncStorage.setItem('objetivosConcluidos', JSON.stringify(data.objetivosConcluidos || []));
    } else {
      // Primeiro login - carrega dados iniciais
      await carregarDadosIniciais();
    }
  } catch (error) {
    console.log('Erro ao carregar do Firebase:', error);
    // Fallback para dados locais
    await carregarDadosLocais();
  }
};


const carregarDadosLocais = async () => {
  try {
    const objetivosSalvos = await AsyncStorage.getItem('objetivos');
    const objetivosConcluidosSalvos = await AsyncStorage.getItem('objetivosConcluidos');

    if (objetivosSalvos && objetivosConcluidosSalvos) {
      setObjetivos(JSON.parse(objetivosSalvos));
      setObjetivosConcluidos(JSON.parse(objetivosConcluidosSalvos));
    } else {
      await carregarDadosIniciais();
    }
  } catch (error) {
    console.log('Erro ao carregar dados locais:', error);
    await carregarDadosIniciais();
  }
};

const carregarDadosIniciais = async () => {
  const objetivosTemporarios = [
    {
      id: '1',
      titulo: 'Beber 3L de água',
      tipo: 'diario',
      concluido: false,
      dataCriacao: '2025-07-06',
      userId: getUserId() || 'user123'
    },
    {
      id: '2',
      titulo: 'Tomar Sol',
      tipo: 'diario',
      concluido: false,
      dataCriacao: '2025-07-06',
      userId: getUserId() || 'user123'
    },
    {
      id: '3',
      titulo: 'Comer 7 porções de frutas',
      tipo: 'semanal',
      concluido: false,
      dataCriacao: '2025-07-06',
      userId: getUserId() || 'user123'
    },
    {
      id: '4',
      titulo: 'Fazer uma trilha',
      tipo: 'mensal',
      concluido: false,
      dataCriacao: '2025-07-06',
      userId: getUserId() || 'user123'
    }
  ];

  const objetivosConcluidosTemporarios = [
    {
      id: '5',
      titulo: 'Meditar 10min',
      tipo: 'diario',
      concluido: true,
      dataCriacao: '2025-07-06',
      dataConclusao: '2025-07-06',
      userId: getUserId() || 'user123'
    },
    {
      id: '6',
      titulo: 'Estudar 1h',
      tipo: 'diario',
      concluido: true,
      dataCriacao: '2025-07-06',
      dataConclusao: '2025-07-06',
      userId: getUserId() || 'user123'
    }
  ];

  setObjetivos(objetivosTemporarios);
  setObjetivosConcluidos(objetivosConcluidosTemporarios);
  
  // Salva dados iniciais
  await salvarDados(objetivosTemporarios, objetivosConcluidosTemporarios);
};


const salvarDados = async (novosObjetivos, novosObjetivosConcluidos) => {
  try {
    // Salva localmente primeiro (para funcionar offline)
    await AsyncStorage.setItem('objetivos', JSON.stringify(novosObjetivos));
    await AsyncStorage.setItem('objetivosConcluidos', JSON.stringify(novosObjetivosConcluidos));
    
    // Salva no Firebase se usuário estiver logado
    const userId = getUserId();
    if (userId) {
      await sincronizarComFirebase(novosObjetivos, novosObjetivosConcluidos);
    }
  } catch (error) {
    console.log('Erro ao salvar dados:', error);
  }
};

const sincronizarComFirebase = async (objetivos, objetivosConcluidos) => {
  try {
    const userId = getUserId();
    if (!userId) return;

    // Salva objetivos no Firebase
    const userDocRef = doc(firestore, COLLECTIONS.USERS, userId);
    
    await setDoc(userDocRef, {
      objetivos: objetivos,
      objetivosConcluidos: objetivosConcluidos,
      ultimaAtualizacao: new Date().toISOString()
    }, { merge: true });
    
    console.log('Dados sincronizados com Firebase');
  } catch (error) {
    console.log('Erro ao sincronizar com Firebase:', error);
  }
};



const marcarConcluido = (objetivoId) => {
  const objetivo = objetivos.find(obj => obj.id === objetivoId);
  if (objetivo) {
    // Remove dos objetivos pendentes
    const novosObjetivos = objetivos.filter(obj => obj.id !== objetivoId);
    
    // Adiciona aos concluídos
    const objetivoConcluido = {
      ...objetivo,
      concluido: true,
      dataConclusao: new Date().toISOString().split('T')[0]
    };
    
    const novosObjetivosConcluidos = [...objetivosConcluidos, objetivoConcluido];
    
    setObjetivos(novosObjetivos);
    setObjetivosConcluidos(novosObjetivosConcluidos);
    
    // Salva os dados
    salvarDados(novosObjetivos, novosObjetivosConcluidos);
  }
};


const desmarcarObjetivo = (objetivoId) => {
    const objetivo = objetivosConcluidos.find(obj => obj.id === objetivoId);
    if (objetivo) {
        // Remove dos objetivos concluídos
        const novosObjetivosConcluidos = objetivosConcluidos.filter(obj => obj.id !== objetivoId);
        
        // Adiciona de volta aos pendentes
        const objetivoPendente = {
            ...objetivo,
            concluido: false,
            dataConclusao: null
        };
        
        const novosObjetivos = [...objetivos, objetivoPendente];
        
        setObjetivosConcluidos(novosObjetivosConcluidos);
        setObjetivos(novosObjetivos);
        
        // Salva os dados
        salvarDados(novosObjetivos, novosObjetivosConcluidos);
    }
};

    const abrirModal = () => {
        setModalVisivel(true);
    };

    const fecharModal = () => {
        setModalVisivel(false);
        setNovoObjetivo('');
        setTipoSelecionado('diario');
    };

const salvarObjetivo = () => {
  if (novoObjetivo.trim().length === 0) {
    Alert.alert('Erro', 'Por favor, digite um título para o objetivo');
    return;
  }

  const novoObjetivoData = {
    id: Date.now().toString(), // ID temporário
    titulo: novoObjetivo.trim(),
    tipo: tipoSelecionado,
    concluido: false,
    dataCriacao: new Date().toISOString().split('T')[0],
    userId: 'user123' // Temporário
  };

  const novosObjetivos = [...objetivos, novoObjetivoData];
  
  setObjetivos(novosObjetivos);
  fecharModal();
  
  // Salva os dados
  salvarDados(novosObjetivos, objetivosConcluidos);
  
  Alert.alert('Sucesso', 'Objetivo adicionado com sucesso!');
};


const excluirObjetivo = (objetivoId, tipoObjetivo) => {
  Alert.alert(
    'Confirmar exclusão',
    'Tem certeza que deseja excluir este objetivo?',
    [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          if (tipoObjetivo === 'pendente') {
            // Remove dos objetivos pendentes
            const novosObjetivos = objetivos.filter(obj => obj.id !== objetivoId);
            setObjetivos(novosObjetivos);
            
            // Salva os dados
            salvarDados(novosObjetivos, objetivosConcluidos);
          } else {
            // Remove dos objetivos concluídos
            const novosObjetivosConcluidos = objetivosConcluidos.filter(obj => obj.id !== objetivoId);
            setObjetivosConcluidos(novosObjetivosConcluidos);
            
            // Salva os dados
            salvarDados(objetivos, novosObjetivosConcluidos);
          }
        },
      },
    ]
  );
};


  const obterTextoTipo = (tipo) => {
    switch (tipo) {
      case 'diario': return 'diário';
      case 'semanal': return 'semanal';
      case 'mensal': return 'mensal';
      default: return tipo;
    }
  };

  const obterCorTipo = (tipo) => {
    switch (tipo) {
      case 'diario': return cores.sucesso;
      case 'semanal': return cores.aviso;
      case 'mensal': return cores.info;
      default: return cores.textoSecundario;
    }
  };

  return (
    <View style={estilos.container}>
      {/* Header com botão adicionar */}
      <View style={estilos.header}>
        <Text style={estilos.titulo}>Health Tracker</Text>
        <TouchableOpacity 
          style={estilos.botaoAdicionar}
          onPress={abrirModal}
        >
          <Text style={estilos.textoBotaoAdicionar}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={estilos.conteudo}>
        {/* Seção Objetivos */}
        <View style={estilos.secao}>
          <Text style={estilos.tituloSecao}>Objetivos</Text>
          
          {objetivos.length === 0 ? (
            <View style={estilos.mensagemVazia}>
              <Text style={estilos.textoVazio}>Nenhum objetivo pendente</Text>
              <Text style={estilos.textoVazioSecundario}>
                Toque em "+ Adicionar" para criar seu primeiro objetivo
              </Text>
            </View>
          ) : (
            <View style={estilos.listaObjetivos}>
              {objetivos.map((objetivo) => (
  <View key={objetivo.id} style={estilos.itemObjetivo}>
    <TouchableOpacity
      style={estilos.checkboxTouchable}
      onPress={() => marcarConcluido(objetivo.id)}
    >
      <View style={estilos.checkbox}>
        <Text style={estilos.checkboxTexto}>☐</Text>
      </View>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={estilos.conteudoObjetivo}
      onPress={() => marcarConcluido(objetivo.id)}
    >
      <Text style={estilos.tituloObjetivo}>{objetivo.titulo}</Text>
      <Text style={[estilos.tipoObjetivo, { color: obterCorTipo(objetivo.tipo) }]}>
        ({obterTextoTipo(objetivo.tipo)})
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={estilos.botaoExcluir}
      onPress={() => excluirObjetivo(objetivo.id, 'pendente')}
    >
      <Text style={estilos.iconeLixeira}>🗑️</Text>
    </TouchableOpacity>
  </View>
))}

            </View>
          )}
        </View>

        {/* Linha divisória */}
        <View style={estilos.divisoria} />

        {/* Seção Objetivos Concluídos */}
        <View style={estilos.secao}>
          <Text style={estilos.tituloSecao}>Objetivos concluídos</Text>
          
          {objetivosConcluidos.length === 0 ? (
            <View style={estilos.mensagemVazia}>
              <Text style={estilos.textoVazio}>Nenhum objetivo concluído hoje</Text>
            </View>
          ) : (
            <View style={estilos.listaObjetivos}>
              {objetivosConcluidos.map((objetivo) => (
  <View key={objetivo.id} style={estilos.itemObjetivoConcluido}>
    <TouchableOpacity
      style={estilos.checkboxTouchable}
      onPress={() => desmarcarObjetivo(objetivo.id)}
    >
      <View style={estilos.checkboxConcluido}>
        <Text style={estilos.checkboxTexto}>✅</Text>
      </View>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={estilos.conteudoObjetivo}
      onPress={() => desmarcarObjetivo(objetivo.id)}
    >
      <Text style={estilos.tituloObjetivoConcluido}>{objetivo.titulo}</Text>
      <Text style={[estilos.tipoObjetivo, { color: obterCorTipo(objetivo.tipo) }]}>
        ({obterTextoTipo(objetivo.tipo)})
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={estilos.botaoExcluir}
      onPress={() => excluirObjetivo(objetivo.id, 'concluido')}
    >
      <Text style={estilos.iconeLixeira}>🗑️</Text>
    </TouchableOpacity>
  </View>
))}


            </View>
          )}
        </View>
            </ScrollView>

      {/* Modal para adicionar objetivo */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisivel}
        onRequestClose={fecharModal}
      >
        <View style={estilos.modalContainer}>
          <View style={estilos.modalConteudo}>
            <Text style={estilos.modalTitulo}>Adicionar Objetivo</Text>
            
            {/* Input do título */}
            <View style={estilos.modalCampo}>
              <Text style={estilos.modalLabel}>Título do objetivo:</Text>
              <TextInput
                style={estilos.modalInput}
                placeholder="Ex: Beber 2L de água"
                value={novoObjetivo}
                onChangeText={setNovoObjetivo}
                multiline={true}
                numberOfLines={2}
              />
            </View>

            {/* Seleção do tipo */}
            <View style={estilos.modalCampo}>
              <Text style={estilos.modalLabel}>Tipo do objetivo:</Text>
              
              <View style={estilos.opcoesTipo}>
                <TouchableOpacity
                  style={[
                    estilos.opcaoTipo,
                    tipoSelecionado === 'diario' && estilos.opcaoTipoSelecionada
                  ]}
                  onPress={() => setTipoSelecionado('diario')}
                >
                  <Text style={[
                    estilos.textoOpcaoTipo,
                    tipoSelecionado === 'diario' && estilos.textoOpcaoTipoSelecionada
                  ]}>
                    Diário
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    estilos.opcaoTipo,
                    tipoSelecionado === 'semanal' && estilos.opcaoTipoSelecionada
                  ]}
                  onPress={() => setTipoSelecionado('semanal')}
                >
                  <Text style={[
                    estilos.textoOpcaoTipo,
                    tipoSelecionado === 'semanal' && estilos.textoOpcaoTipoSelecionada
                  ]}>
                    Semanal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    estilos.opcaoTipo,
                    tipoSelecionado === 'mensal' && estilos.opcaoTipoSelecionada
                  ]}
                  onPress={() => setTipoSelecionado('mensal')}
                >
                  <Text style={[
                    estilos.textoOpcaoTipo,
                    tipoSelecionado === 'mensal' && estilos.textoOpcaoTipoSelecionada
                  ]}>
                    Mensal
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botões */}
            <View style={estilos.modalBotoes}>
              <TouchableOpacity
                style={estilos.botaoCancelar}
                onPress={fecharModal}
              >
                <Text style={estilos.textoBotaoCancelar}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={estilos.botaoSalvar}
                onPress={salvarObjetivo}
              >
                <Text style={estilos.textoBotaoSalvar}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: cores.fundoCartao,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
   },
titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cores.texto,
  },
  botaoAdicionar: {
    backgroundColor: cores.primaria,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  textoBotaoAdicionar: {
    color: cores.branco,
    fontWeight: 'bold',
    fontSize: 16,
  },
  conteudo: {
    flex: 1,
    paddingHorizontal: 20,
  },
  secao: {
    marginVertical: 20,
  },
  tituloSecao: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 15,
  },
  listaObjetivos: {
    backgroundColor: cores.fundoCartao,
    borderRadius: 12,
    padding: 15,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },itemObjetivo: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: cores.borda,
},
itemObjetivoConcluido: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: cores.borda,
  opacity: 0.7,
},
checkboxTouchable: {
  marginRight: 15,
},
botaoExcluir: {
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
  backgroundColor: 'rgba(255, 0, 0, 0.1)',
  marginLeft: 8,
},
iconeLixeira: {
  fontSize: 16,
  color: '#FF4444',
},

  checkbox: {
    marginRight: 15,
  },
  checkboxConcluido: {
    marginRight: 15,
  },
  checkboxTexto: {
    fontSize: 20,
  },
  conteudoObjetivo: {
    flex: 1,
    marginRight: 8,
  },
  tituloObjetivo: {
    fontSize: 16,
    fontWeight: '600',
    color: cores.texto,
    marginBottom: 2,
  },
  tituloObjetivoConcluido: {
    fontSize: 16,
    fontWeight: '600',
    color: cores.textoSecundario,
    marginBottom: 2,
    textDecorationLine: 'line-through',
  },
  tipoObjetivo: {
    fontSize: 14,
    fontWeight: '500',
  },
  divisoria: {
    height: 1,
    backgroundColor: cores.borda,
    marginVertical: 10,
  },
  mensagemVazia: {
    backgroundColor: cores.fundoCartao,
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },
  textoVazio: {
    fontSize: 16,
    color: cores.textoSecundario,
    textAlign: 'center',
    marginBottom: 5,
  },
    textoVazioSecundario: {
    fontSize: 14,
    color: cores.textoClaro,
    textAlign: 'center',
  },
  
  // Estilos do Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalConteudo: {
    backgroundColor: cores.fundoCartao,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cores.texto,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalCampo: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: cores.texto,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: cores.texto,
    backgroundColor: cores.fundo,
    textAlignVertical: 'top',
  },
  opcoesTipo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  opcaoTipo: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.fundo,
    alignItems: 'center',
  },
  opcaoTipoSelecionada: {
    backgroundColor: cores.primaria,
    borderColor: cores.primaria,
  },
  textoOpcaoTipo: {
    fontSize: 14,
    fontWeight: '500',
    color: cores.texto,
  },
  textoOpcaoTipoSelecionada: {
    color: cores.branco,
  },
  modalBotoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },
  botaoCancelar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.fundo,
    alignItems: 'center',
  },
  textoBotaoCancelar: {
    fontSize: 16,
    fontWeight: '600',
    color: cores.textoSecundario,
  },
  botaoSalvar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: cores.primaria,
    alignItems: 'center',
  },
  textoBotaoSalvar: {
    fontSize: 16,
    fontWeight: '600',
    color: cores.branco,
  }
});
