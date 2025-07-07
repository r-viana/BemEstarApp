import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { cores } from '../../utils/Cores';
import { auth } from '../../services/FirebaseConfig';
import { updateProfile } from 'firebase/auth';

export default function EditarNome({ visivel, nomeAtual, onFechar, onSucesso }) {
  const [novoNome, setNovoNome] = useState(nomeAtual);
  const [carregando, setCarregando] = useState(false);

  const salvarNome = async () => {
    if (!novoNome.trim()) {
      Alert.alert('Erro', 'Nome não pode estar vazio');
      return;
    }

    setCarregando(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: novoNome.trim()
      });
      
      onSucesso(novoNome.trim());
      onFechar();
      Alert.alert('Sucesso', 'Nome atualizado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o nome');
    } finally {
      setCarregando(false);
    }
  };

  const fecharModal = () => {
    setNovoNome(nomeAtual); // Reseta o valor
    onFechar();
  };

  return (
    <Modal
      visible={visivel}
      transparent={true}
      animationType="slide"
      onRequestClose={fecharModal}
    >
      <View style={estilos.modalOverlay}>
        <View style={estilos.modalContainer}>
          <Text style={estilos.modalTitulo}>Editar Nome</Text>
          
          <TextInput
            style={estilos.modalInput}
            value={novoNome}
            onChangeText={setNovoNome}
            placeholder="Digite o novo nome"
            autoFocus={true}
            editable={!carregando}
          />
          
          <View style={estilos.modalBotoes}>
            <TouchableOpacity 
              style={[estilos.botaoModalCancelar, carregando && estilos.botaoDesabilitado]}
              onPress={fecharModal}
              disabled={carregando}
            >
              <Text style={estilos.textoBotaoModalCancelar}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[estilos.botaoModalConfirmar, carregando && estilos.botaoDesabilitado]}
              onPress={salvarNome}
              disabled={carregando}
            >
              {carregando ? (
                <ActivityIndicator size="small" color={cores.branco} />
              ) : (
                <Text style={estilos.textoBotaoModalConfirmar}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const estilos = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: cores.branco,
    borderRadius: 15,
    padding: 25,
    width: '85%',
    maxWidth: 400,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cores.texto,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: cores.fundoInput || cores.branco,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: cores.texto,
    marginBottom: 20,
  },
  modalBotoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  botaoModalCancelar: {
    backgroundColor: cores.textoSecundario,
    borderRadius: 8,
    padding: 15,
    flex: 1,
  },
  textoBotaoModalCancelar: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  botaoModalConfirmar: {
    backgroundColor: cores.primaria,
    borderRadius: 8,
    padding: 15,
    flex: 1,
  },
  textoBotaoModalConfirmar: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
};
