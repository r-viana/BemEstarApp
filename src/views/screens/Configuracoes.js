import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { cores } from '../../utils/Cores';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Configuracoes({ navigation }) {

    useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'Configurações',
      headerStyle: { backgroundColor: cores.primaria },
      headerTintColor: cores.branco,
      headerTitleStyle: { fontWeight: 'bold' }
    });
  }, [navigation]);



  const [configuracoes, setConfiguracoes] = useState({
    notificacoes: true,
    lembreteDiario: true,
    modoEscuro: false,
    unidadeDistancia: 'km', // 'km' ou 'milhas'
    formatoHora: '24h', // '24h' ou '12h'
    metaDiariaMinutos: 30,
  });

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const configSalvas = await AsyncStorage.getItem('configuracoes');
      if (configSalvas) {
        setConfiguracoes(JSON.parse(configSalvas));
      }
    } catch (error) {
      console.log('Erro ao carregar configurações:', error);
    }
  };

  const salvarConfiguracoes = async (novasConfigs) => {
    try {
      await AsyncStorage.setItem('configuracoes', JSON.stringify(novasConfigs));
      setConfiguracoes(novasConfigs);
    } catch (error) {
      console.log('Erro ao salvar configurações:', error);
    }
  };

  const alterarConfiguracao = (chave, valor) => {
    const novasConfigs = { ...configuracoes, [chave]: valor };
    salvarConfiguracoes(novasConfigs);
  };

  const resetarDados = () => {
    Alert.alert(
      'Resetar Dados',
      'Isso apagará todo seu histórico de atividades. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Resetar', 
          style: 'destructive',
          onPress: () => {
            // Implementar lógica de reset
            Alert.alert('Sucesso', 'Dados resetados com sucesso!');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={estilos.container}>
      {/* Seção de Notificações */}
      <View style={estilos.secao}>
        <Text style={estilos.tituloSecao}>Notificações</Text>
        
        <View style={estilos.itemConfiguracao}>
          <Text style={estilos.labelConfig}>Notificações Gerais</Text>
          <Switch
            value={configuracoes.notificacoes}
            onValueChange={(valor) => alterarConfiguracao('notificacoes', valor)}
            trackColor={{ false: cores.borda, true: cores.primaria }}
            thumbColor={configuracoes.notificacoes ? cores.branco : cores.textoClaro}
          />
        </View>

        <View style={estilos.itemConfiguracao}>
          <Text style={estilos.labelConfig}>Lembrete Diário</Text>
          <Switch
            value={configuracoes.lembreteDiario}
            onValueChange={(valor) => alterarConfiguracao('lembreteDiario', valor)}
            trackColor={{ false: cores.borda, true: cores.primaria }}
            thumbColor={configuracoes.lembreteDiario ? cores.branco : cores.textoClaro}
          />
        </View>
      </View>

      {/* Seção de Aparência */}
      <View style={estilos.secao}>
        <Text style={estilos.tituloSecao}>Aparência</Text>
        
        <View style={estilos.itemConfiguracao}>
          <Text style={estilos.labelConfig}>Modo Escuro</Text>
          <Switch
            value={configuracoes.modoEscuro}
            onValueChange={(valor) => alterarConfiguracao('modoEscuro', valor)}
            trackColor={{ false: cores.borda, true: cores.primaria }}
            thumbColor={configuracoes.modoEscuro ? cores.branco : cores.textoClaro}
          />
        </View>
      </View>

      {/* Seção de Unidades */}
      <View style={estilos.secao}>
        <Text style={estilos.tituloSecao}>Unidades</Text>
        
        <TouchableOpacity 
          style={estilos.itemBotao}
          onPress={() => {
            const novaUnidade = configuracoes.unidadeDistancia === 'km' ? 'milhas' : 'km';
            alterarConfiguracao('unidadeDistancia', novaUnidade);
          }}
        >
          <Text style={estilos.labelConfig}>Unidade de Distância</Text>
          <Text style={estilos.valorConfig}>{configuracoes.unidadeDistancia}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={estilos.itemBotao}
          onPress={() => {
            const novoFormato = configuracoes.formatoHora === '24h' ? '12h' : '24h';
            alterarConfiguracao('formatoHora', novoFormato);
          }}
        >
          <Text style={estilos.labelConfig}>Formato de Hora</Text>
          <Text style={estilos.valorConfig}>{configuracoes.formatoHora}</Text>
        </TouchableOpacity>
      </View>

      {/* Seção de Dados */}
      <View style={estilos.secao}>
        <Text style={estilos.tituloSecao}>Dados</Text>
        
        <TouchableOpacity style={estilos.itemBotao}>
          <Text style={estilos.labelConfig}>Exportar Dados</Text>
          <Text style={estilos.valorConfig}>📤</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={estilos.itemBotao}
          onPress={resetarDados}
        >
          <Text style={[estilos.labelConfig, { color: cores.perigo }]}>Resetar Todos os Dados</Text>
          <Text style={estilos.valorConfig}>⚠️</Text>
        </TouchableOpacity>
      </View>

      {/* Seção Sobre */}
      <View style={estilos.secao}>
        <Text style={estilos.tituloSecao}>Sobre</Text>
        
        <TouchableOpacity style={estilos.itemBotao}>
          <Text style={estilos.labelConfig}>Versão do App</Text>
          <Text style={estilos.valorConfig}>1.0.0</Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilos.itemBotao}>
          <Text style={estilos.labelConfig}>Política de Privacidade</Text>
          <Text style={estilos.valorConfig}>📄</Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilos.itemBotao}>
          <Text style={estilos.labelConfig}>Contato</Text>
          <Text style={estilos.valorConfig}>📧</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  secao: {
    marginHorizontal: 20,
    marginVertical: 15,
  },
  tituloSecao: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 10,
  },
  itemConfiguracao: {
    backgroundColor: cores.fundoCartao,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 2,
    elevation: 2,
  },
  itemBotao: {
    backgroundColor: cores.fundoCartao,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 2,
    elevation: 2,
  },
  labelConfig: {
    fontSize: 16,
    color: cores.texto,
    fontWeight: '500',
  },
  valorConfig: {
    fontSize: 16,
    color: cores.textoSecundario,
    fontWeight: '500',
  },
});