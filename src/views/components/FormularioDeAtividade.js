import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Switch, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { criarAtividade, atualizarAtividade } from '../../services/AtividadeService';
import { cores } from '../../utils/Cores';

// Tipos de atividades disponíveis
const TIPOS_ATIVIDADES = [
  'Caminhada & Corrida',
  'Ciclismo', 
  'Natação',
  'Musculação',
  'Yoga',
  'Pilates',
  'Dança',
  'Funcional',
  'Alongamento',
  'Relaxamento',
  'Meditação',
  'Leitura',
  'Terapia',
  'Aprendizado de nova habilidade'
];

// atividades que podem ser outdoor
const ATIVIDADES_OUTDOOR_POSSIVEIS = [
  'Caminhada & Corrida', 
  'Ciclismo', 
  'Natação',
  'Musculação',
  'Yoga',
  'Pilates',
  'Dança',
  'Funcional',
  'Alongamento'
];

// Palavras-chave para definição de é outdoor
const PALAVRAS_CHAVE_OUTDOOR = ['parque', 'rua', 'praia', 'trilha', 'externo', 'fora'];
const PALAVRAS_CHAVE_INDOOR = ['academia', 'casa', 'studio', 'ginásio', 'interno', 'dentro'];

const FormularioDeAtividade = ({ onCancel, initialValues }) => {
  const navigation = useNavigation();
  
  // Estados para cada campo do formulário
  const [tipo, setTipo] = useState(initialValues?.type || 'Caminhada & Corrida');
  const [data, setData] = useState(() => {
    if (initialValues?.date) {
      // Se for um objeto Date válido
      if (initialValues.date instanceof Date) {
        return initialValues.date;
      }
      // Se for um objeto com seconds (Timestamp do Firebase)
      if (initialValues.date.seconds) {
        return new Date(initialValues.date.seconds * 1000);
      }
      // Se for uma string ISO
      if (typeof initialValues.date === 'string') {
        const parsedDate = new Date(initialValues.date);
        return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      }
    }
    // Padrão: agora
    return new Date();
  });
  const [duracao, setDuracao] = useState(initialValues?.durationMinutes?.toString() || '');
  const [local, setLocal] = useState(initialValues?.locationName || '');
  const [isOutdoor, setIsOutdoor] = useState(initialValues?.isOutdoor || false);
  const [distancia, setDistancia] = useState(initialValues?.distanceKm?.toString() || '');
  const [notas, setNotas] = useState(initialValues?.notes || '');

  // Estados para controle de UI
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTipoPicker, setShowTipoPicker] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Lógica para exibir campos condicionais
  const showOutdoorToggle = true; // Sempre mostrar para todos os tipos
  const showDistanceInput = ['Caminhada & Corrida', 'Ciclismo', 'Natação'].includes(tipo); // Apenas para essas atividades

  // Efeito para auto-sugerir se a atividade é outdoor com base no local
  useEffect(() => {
    // Agora funciona para todos os tipos de atividade
    const localLowerCase = local.toLowerCase();
    if (PALAVRAS_CHAVE_OUTDOOR.some(keyword => localLowerCase.includes(keyword))) {
      setIsOutdoor(true);
    } else if (PALAVRAS_CHAVE_INDOOR.some(keyword => localLowerCase.includes(keyword))) {
      setIsOutdoor(false);
    }
  }, [local]); // Removido showOutdoorToggle da dependência

  const handleSave = async () => {
    // Validação específica por campo
    if (!tipo) {
      Alert.alert('Campo Obrigatório', 'Por favor, selecione o tipo de atividade.');
      return;
    }

    if (!duracao.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe a duração da atividade.');
      return;
    }

    if (!local.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe o local da atividade.');
      return;
    }

    // Validação de duração
    const duracaoNum = parseInt(duracao, 10);
    if (isNaN(duracaoNum) || duracaoNum <= 0) {
      Alert.alert('Erro', 'Duração deve ser um número maior que zero.');
      return;
    }

    // Validação de data
    if (!data || isNaN(data.getTime())) {
      Alert.alert('Erro', 'Data inválida. Por favor, selecione uma data válida.');
      return;
    }

    // Validação de distância (se aplicável)
    let distanciaNum = 0;
    if (showDistanceInput && distancia.trim()) {
      // Substituir vírgula por ponto para parseFloat funcionar
      const distanciaNormalizada = distancia.trim().replace(',', '.');
      distanciaNum = parseFloat(distanciaNormalizada);
      if (isNaN(distanciaNum) || distanciaNum < 0) {
        Alert.alert('Erro', 'Distância deve ser um número válido (ex: 5.5 ou 5,5).');
        return;
      }
    }

    setSalvando(true);
    
    try {
      const activityData = {
        type: tipo,
        date: data,
        durationMinutes: duracaoNum,
        locationName: local.trim(),
        notes: notas.trim(),
        isOutdoor: isOutdoor, // Sempre salvar o valor do toggle
        distanceKm: showDistanceInput ? distanciaNum : 0,
      };

      console.log('Dados a serem salvos:', activityData); // Debug
      
      if (initialValues && initialValues.id) {
        // Atualizando atividade existente
        await atualizarAtividade(initialValues.id, activityData);
        Alert.alert(
          'Sucesso!', 
          'Atividade atualizada com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('HistoricoDeAtividades');
              }
            }
          ]
        );
      } else {
        // Criando nova atividade
        await criarAtividade(activityData);
        Alert.alert(
          'Sucesso!', 
          'Atividade criada com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('HistoricoDeAtividades');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erro ao salvar atividade:', error);
      Alert.alert('Erro', error.message || 'Não foi possível salvar a atividade');
    } finally {
      setSalvando(false);
    }
  };

  // Função para tratar mudança de data
  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setData(selectedDate);
    }
  };

  // Função para tratar mudança de hora
  const onChangeTime = (event, selectedTime) => {
    setShowTimePicker(false);
    if (event.type === 'set' && selectedTime) {
      // Combinar a data atual com a nova hora
      const newDateTime = new Date(data);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setData(newDateTime);
    }
  };

  const selecionarTipo = (tipoSelecionado) => {
    setTipo(tipoSelecionado);
    setShowTipoPicker(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Tipo de Atividade *</Text>
      <TouchableOpacity 
        style={styles.pickerButton}
        onPress={() => setShowTipoPicker(true)}
        disabled={salvando}
      >
        <Text style={styles.pickerButtonText}>{tipo}</Text>
        <Text style={styles.pickerArrow}>▼</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Data e Hora *</Text>
      <View style={styles.dateTimeContainer}>
        <TouchableOpacity 
          onPress={() => setShowDatePicker(true)} 
          style={[styles.dateButton, { flex: 1, marginRight: 10 }]}
          disabled={salvando}
        >
          <Text style={styles.dateText}>
            📅 {data.toLocaleDateString('pt-BR')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setShowTimePicker(true)} 
          style={[styles.dateButton, { flex: 1 }]}
          disabled={salvando}
        >
          <Text style={styles.dateText}>
            🕐 {data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          testID="datePicker"
          value={data}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={onChangeDate}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          testID="timePicker"
          value={data}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChangeTime}
        />
      )}

      <Text style={styles.label}>Duração (em minutos) *</Text>
      <TextInput
        style={styles.input}
        value={duracao}
        onChangeText={setDuracao}
        keyboardType="numeric"
        placeholder="Ex: 60"
        editable={!salvando}
      />

      <Text style={styles.label}>Local da Prática *</Text>
      <TextInput
        style={styles.input}
        value={local}
        onChangeText={setLocal}
        placeholder="Ex: Parque Ibirapuera, Academia, Casa"
        editable={!salvando}
      />

      {showOutdoorToggle && (
        <View style={styles.switchContainer}>
          <Text style={styles.label}>Atividade Ao Ar Livre?</Text>
          <Switch
            trackColor={{ false: cores.trackerDesligada, true: cores.trackerLigada }}
            thumbColor={isOutdoor ? cores.botaoLigado : cores.botaoDesligado}
            onValueChange={() => setIsOutdoor(previousState => !previousState)}
            value={isOutdoor}
            disabled={salvando}
          />
        </View>
      )}

      {showDistanceInput && (
        <>
          <Text style={styles.label}>Distância (km)</Text>
          <TextInput
            style={styles.input}
            value={distancia}
            onChangeText={setDistancia}
            keyboardType="numeric"
            placeholder="Ex: 5.5 ou 5,5 (opcional)"
            editable={!salvando}
          />
        </>
      )}

      <Text style={styles.label}>Anotações (opcional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notas}
        onChangeText={setNotas}
        multiline={true}
        placeholder="Como você se sentiu? Alguma observação?"
        editable={!salvando}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.cancelButton, salvando && styles.buttonDisabled]}
          onPress={onCancel}
          disabled={salvando}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, salvando && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={salvando}
        >
          {salvando ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={cores.branco} />
              <Text style={[styles.saveButtonText, { marginLeft: 10 }]}>
                Salvando...
              </Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>
              {initialValues ? "Atualizar" : "Salvar"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal para seleção de tipo */}
      <Modal
        visible={showTipoPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTipoPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Selecionar Tipo de Atividade</Text>
            <ScrollView style={styles.modalList}>
              {TIPOS_ATIVIDADES.map((tipoItem, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalItem,
                    tipo === tipoItem && styles.modalItemSelected
                  ]}
                  onPress={() => selecionarTipo(tipoItem)}
                >
                  <Text style={[
                    styles.modalItemText,
                    tipo === tipoItem && styles.modalItemTextSelected
                  ]}>
                    {tipoItem}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTipoPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: cores.fundo,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    color: cores.texto,
  },
  input: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: cores.fundoInput,
    color: cores.texto,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    padding: 12,
    backgroundColor: cores.fundoInput,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: cores.texto,
  },
  pickerArrow: {
    fontSize: 12,
    color: cores.textoSecundario,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 50,
    gap: 15,
  },
  cancelButton: {
    backgroundColor: cores.textoSecundario,
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: cores.primaria,
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  saveButtonText: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    padding: 12,
    backgroundColor: cores.fundoInput,
  },
  dateText: {
    fontSize: 16,
    textAlign: 'center',
    color: cores.texto,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: cores.fundoCartao,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  modalItemSelected: {
    backgroundColor: cores.primaria,
    borderRadius: 8,
    marginVertical: 2,
  },
  modalItemText: {
    fontSize: 16,
    color: cores.texto,
  },
  modalItemTextSelected: {
    color: cores.branco,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    backgroundColor: cores.textoSecundario,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCloseButtonText: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FormularioDeAtividade;