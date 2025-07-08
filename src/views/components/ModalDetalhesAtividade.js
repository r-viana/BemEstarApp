import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { cores } from '../../utils/Cores';
import { obterIconePorTipo } from '../../services/AtividadeService';

export default function ModalDetalhesAtividade({ visivel, atividade, onFechar, onEditar, onExcluir }) {
  if (!atividade) return null;

  const dados = atividade.dadosOriginais;
  const icone = obterIconePorTipo(dados.tipo);

  // Formatar data completa
  const dataCompleta = dados.data.toLocaleString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Formatar duração
  const horas = Math.floor(dados.duracaoMinutos / 60);
  const minutos = dados.duracaoMinutos % 60;
  const duracaoFormatada = horas > 0 
    ? `${horas}h ${minutos}min`
    : `${minutos} minutos`;

  return (
    <Modal
      visible={visivel}
      transparent={true}
      animationType="slide"
      onRequestClose={onFechar}
    >
      <View style={estilos.modalOverlay}>
        <View style={estilos.modalContainer}>
          {/* Header do Modal */}
          <View style={estilos.modalHeader}>
            <View style={estilos.headerIcone}>
              <Text style={estilos.iconeGrande}>{icone}</Text>
            </View>
            <View style={estilos.headerTexto}>
              <Text style={estilos.modalTitulo}>{dados.tipo}</Text>
              <Text style={estilos.modalSubtitulo}>{dataCompleta}</Text>
            </View>
            <TouchableOpacity 
              style={estilos.botaoFechar}
              onPress={onFechar}
            >
              <Text style={estilos.textoFechar}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Conteúdo do Modal */}
          <ScrollView style={estilos.modalConteudo} showsVerticalScrollIndicator={false}>
            
            {/* Informações Principais */}
            <View style={estilos.secao}>
              <Text style={estilos.tituloSecao}>📊 Informações</Text>
              
              <View style={estilos.infoItem}>
                <Text style={estilos.infoLabel}>Duração:</Text>
                <Text style={estilos.infoValor}>{duracaoFormatada}</Text>
              </View>

              <View style={estilos.infoItem}>
                <Text style={estilos.infoLabel}>Local:</Text>
                <Text style={estilos.infoValor}>{dados.local}</Text>
              </View>

              <View style={estilos.infoItem}>
                <Text style={estilos.infoLabel}>Tipo:</Text>
                <Text style={estilos.infoValor}>
                  {dados.isOutdoor ? '🌤️ Ao Ar Livre' : '🏠 Ambiente Fechado'}
                </Text>
              </View>

              {dados.distanciaKm > 0 && (
                <View style={estilos.infoItem}>
                  <Text style={estilos.infoLabel}>Distância:</Text>
                  <Text style={estilos.infoValor}>{dados.distanciaKm} km</Text>
                </View>
              )}
            </View>

            {/* Anotações */}
            {dados.notas && dados.notas.trim() && (
              <View style={estilos.secao}>
                <Text style={estilos.tituloSecao}>📝 Anotações</Text>
                <View style={estilos.notasContainer}>
                  <Text style={estilos.notasTexto}>{dados.notas}</Text>
                </View>
              </View>
            )}

            {/* Metadados */}
            <View style={estilos.secao}>
              <Text style={estilos.tituloSecao}>🕒 Registro</Text>
              <View style={estilos.infoItem}>
                <Text style={estilos.infoLabel}>Criado em:</Text>
                <Text style={estilos.infoValorPequeno}>
                  {dados.criadoEm.toLocaleString('pt-BR')}
                </Text>
              </View>
              {dados.atualizadoEm.getTime() !== dados.criadoEm.getTime() && (
                <View style={estilos.infoItem}>
                  <Text style={estilos.infoLabel}>Atualizado em:</Text>
                  <Text style={estilos.infoValorPequeno}>
                    {dados.atualizadoEm.toLocaleString('pt-BR')}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Botões de Ação */}
          <View style={estilos.modalBotoes}>
            <TouchableOpacity
              style={estilos.botaoEditar}
              onPress={() => {
                onFechar();
                onEditar(atividade.id);
              }}
            >
              <Text style={estilos.textoBotaoEditar}>✏️ Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.botaoExcluir}
              onPress={() => {
                onFechar();
                onExcluir(atividade.id);
              }}
            >
              <Text style={estilos.textoBotaoExcluir}>🗑️ Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: cores.fundoCartao,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  headerIcone: {
    backgroundColor: cores.primaria,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconeGrande: {
    fontSize: 24,
    color: cores.branco,
  },
  headerTexto: {
    flex: 1,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 4,
  },
  modalSubtitulo: {
    fontSize: 14,
    color: cores.textoSecundario,
  },
  botaoFechar: {
    backgroundColor: cores.textoClaro,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoFechar: {
    fontSize: 16,
    color: cores.branco,
    fontWeight: 'bold',
  },
  modalConteudo: {
    flex: 1,
    paddingHorizontal: 20,
  },
  secao: {
    marginVertical: 15,
  },
  tituloSecao: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  infoLabel: {
    fontSize: 14,
    color: cores.textoSecundario,
    fontWeight: '500',
  },
  infoValor: {
    fontSize: 14,
    color: cores.texto,
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  infoValorPequeno: {
    fontSize: 12,
    color: cores.textoSecundario,
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  notasContainer: {
    backgroundColor: cores.fundo,
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 3,
    borderLeftColor: cores.primaria,
  },
  notasTexto: {
    fontSize: 14,
    color: cores.texto,
    lineHeight: 20,
  },
  modalBotoes: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  botaoEditar: {
    flex: 1,
    backgroundColor: cores.primaria,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  textoBotaoEditar: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
  },
  botaoExcluir: {
    flex: 1,
    backgroundColor: cores.perigo,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  textoBotaoExcluir: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
  },
});