
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Switch, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

// atividades que podem ser outdoor
const ATIVIDADES_OUTDOOR_POSSIVEIS = ['Caminhada & Corrida', 'Ciclismo', 'Natação'];

// Palavras-chave para definição de é outdoor
const PALAVRAS_CHAVE_OUTDOOR = ['parque', 'rua', 'praia', 'trilha', 'externo', 'fora'];
const PALAVRAS_CHAVE_INDOOR = ['academia', 'casa', 'studio', 'ginásio', 'interno', 'dentro'];

const FormularioDeAtividade = ({ onSave, onCancel, initialValues }) => {
  // Estados para cada campo do formulário
  const [tipo, setTipo] = useState(initialValues?.type || 'Caminhada & Corrida');
  const [data, setData] = useState(initialValues?.date ? new Date(initialValues.date.seconds * 1000) : new Date());
  const [duracao, setDuracao] = useState(initialValues?.durationMinutes?.toString() || '');
  const [local, setLocal] = useState(initialValues?.locationName || '');
  const [isOutdoor, setIsOutdoor] = useState(initialValues?.isOutdoor || false);
  const [distancia, setDistancia] = useState(initialValues?.distanceKm?.toString() || '');
  const [notas, setNotas] = useState(initialValues?.notes || '');

  // Estado para controlar a visibilidade do seletor de data/hora
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Lógica para exibir campos condicionais
  const showOutdoorToggle = ATIVIDADES_OUTDOOR_POSSIVEIS.includes(tipo);
  const showDistanceInput = showOutdoorToggle && isOutdoor;

  // Efeito para auto-sugerir se a atividade é outdoor com base no local
  useEffect(() => {
    if (!showOutdoorToggle) {
      setIsOutdoor(false);
      return;
    }
    const localLowerCase = local.toLowerCase();
    if (PALAVRAS_CHAVE_OUTDOOR.some(keyword => localLowerCase.includes(keyword))) {
      setIsOutdoor(true);
    } else if (PALAVRAS_CHAVE_INDOOR.some(keyword => localLowerCase.includes(keyword))) {
      setIsOutdoor(false);
    }
  }, [local, showOutdoorToggle]);

  const handleSave = () => {
    // Validação aprimorada para incluir todos os campos obrigatórios
    if (!tipo || !duracao.trim() || !local.trim()) {
      Alert.alert(
        'Campos Obrigatórios',
        'Por favor, preencha todos os campos obrigatórios: Tipo, Duração e Local.'
      );
      return;
    }

    const activityData = {
      type: tipo,
      date: data,
      durationMinutes: parseInt(duracao, 10),
      locationName: local.trim(),
      notes: notas.trim(),
      isOutdoor: showOutdoorToggle ? isOutdoor : false,
      distanceKm: showDistanceInput ? parseFloat(distancia) || 0 : 0,
    };
    
    onSave(activityData);
  };

  // Função de data/hora ajustada para o comportamento padrão do Android
  const onChangeDate = (event, selectedDate) => {
    // O picker é fechado automaticamente no Android após a seleção ou cancelamento
    setShowDatePicker(false);
    // A data só é atualizada se o usuário confirmar a seleção ('set')
    if (event.type === 'set' && selectedDate) {
      setData(selectedDate);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Tipo de Atividade *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={tipo}
          onValueChange={(itemValue) => setTipo(itemValue)}
        >
          <Picker.Item label="Caminhada & Corrida" value="Caminhada & Corrida" />
          <Picker.Item label="Ciclismo" value="Ciclismo" />
          <Picker.Item label="Natação" value="Natação" />
          <Picker.Item label="Musculação" value="Musculação" />
          <Picker.Item label="Yoga" value="Yoga" />
          <Picker.Item label="Pilates" value="Pilates" />
          <Picker.Item label="Dança" value="Dança" />
          <Picker.Item label="Funcional" value="Funcional" />
          <Picker.Item label="Alongamento" value="Alongamento" />
          <Picker.Item label="Relaxamento" value="Relaxamento" />
          <Picker.Item label="Meditação" value="Meditação" />
          <Picker.Item label="Leitura" value="Leitura" />
          <Picker.Item label="Terapia" value="Terapia" />
         {/* <Picker.Item label="Estudos" value="Estudos" /> */}
          <Picker.Item label="Aprendizado de nova habilidade" value="Aprendizado de nova habilidade" />
        </Picker>
      </View>

      <Text style={styles.label}>Data e Hora *</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
        <Text style={styles.dateText}>{data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={data}
          mode="datetime"
          is24Hour={true}
          display="default"
          onChange={onChangeDate}
        />
      )}

      <Text style={styles.label}>Duração (em minutos) *</Text>
      <TextInput
        style={styles.input}
        value={duracao}
        onChangeText={setDuracao}
        keyboardType="numeric"
        placeholder="Ex: 60"
      />

      <Text style={styles.label}>Local da Prática *</Text>
      <TextInput
        style={styles.input}
        value={local}
        onChangeText={setLocal}
        placeholder="Ex: Parque Ibirapuera, Academia, Casa"
      />

      {showOutdoorToggle && (
        <View style={styles.switchContainer}>
          <Text style={styles.label}>É atividade outdoor?</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isOutdoor ? "#f5dd4b" : "#f4f3f4"}
            onValueChange={() => setIsOutdoor(previousState => !previousState)}
            value={isOutdoor}
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
            placeholder="Ex: 5.5"
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
      />

      <View style={styles.buttonContainer}>
        <Button title="Cancelar" onPress={onCancel} color="#ff6347" />
        <Button title={initialValues ? "Atualizar" : "Salvar"} onPress={handleSave} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
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
    justifyContent: 'space-around',
    marginTop: 30,
    marginBottom: 50,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    textAlign: 'center',
  }
});

export default FormularioDeAtividade;
