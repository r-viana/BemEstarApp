import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  Alert 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { cores } from '../../utils/Cores';
import { obterEstatisticasComCache, limparCacheEstatisticas } from '../../services/EstatisticasService';

export default function Estatisticas({ navigation }) {
  const [estatisticas, setEstatisticas] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  // Carregar estatísticas quando a tela ganhar foco
  useFocusEffect(
    React.useCallback(() => {
      carregarEstatisticas();
    }, [])
  );

  const carregarEstatisticas = async (forcarRecalculo = false) => {
    try {
      if (!forcarRecalculo) {
        setCarregando(true);
      }
      
      console.log('Carregando estatísticas...');
      const dados = await obterEstatisticasComCache(forcarRecalculo);
      
      if (dados) {
        setEstatisticas(dados);
      } else {
        Alert.alert('Erro', 'Não foi possível carregar as estatísticas');
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      Alert.alert('Erro', 'Erro ao carregar estatísticas');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  };

  const handleRefresh = () => {
    setAtualizando(true);
    limparCacheEstatisticas(); // Limpar cache para forçar recálculo
    carregarEstatisticas(true);
  };

  // Componente para cards de estatísticas
  const CardEstatistica = ({ titulo, valor, subtitulo, icone, cor = cores.primaria }) => (
    <View style={[estilos.cardEstatistica, { borderLeftColor: cor }]}>
      <View style={estilos.cardHeader}>
        <Text style={estilos.cardIcone}>{icone}</Text>
        <Text style={estilos.cardTitulo}>{titulo}</Text>
      </View>
      <Text style={[estilos.cardValor, { color: cor }]}>{valor}</Text>
      {subtitulo && <Text style={estilos.cardSubtitulo}>{subtitulo}</Text>}
    </View>
  );

  // Componente para seções
  const SecaoEstatisticas = ({ titulo, children }) => (
    <View style={estilos.secao}>
      <Text style={estilos.tituloSecao}>{titulo}</Text>
      {children}
    </View>
  );

  // Loading state
  if (carregando) {
    return (
      <View style={estilos.loadingContainer}>
        <ActivityIndicator size="large" color={cores.primaria} />
        <Text style={estilos.loadingText}>Calculando estatísticas...</Text>
      </View>
    );
  }

  // Empty state
  if (!estatisticas || !estatisticas.gerais) {
    return (
      <View style={estilos.emptyContainer}>
        <Text style={estilos.emptyIcone}>📊</Text>
        <Text style={estilos.emptyTitulo}>Nenhuma atividade registrada</Text>
        <Text style={estilos.emptySubtitulo}>
          Registre suas primeiras atividades para ver suas estatísticas!
        </Text>
        <TouchableOpacity 
          style={estilos.botaoNovaAtividade}
          onPress={() => navigation.navigate('TelaFormularioDeAtividade')}
        >
          <Text style={estilos.textoBotaoNovaAtividade}>➕ Registrar Atividade</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { gerais, porTipo, periodos, distancias } = estatisticas;

  return (
    <ScrollView 
      style={estilos.container}
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={handleRefresh}
          colors={[cores.primaria]}
        />
      }
    >
      {/* Estatísticas Gerais */}
      <SecaoEstatisticas titulo="📊 Resumo Geral">
        <View style={estilos.cardsContainer}>
          <CardEstatistica
            titulo="Total de Atividades"
            valor={gerais.totalAtividades.toString()}
            subtitulo="atividades registradas"
            icone="🎯"
            cor={cores.primaria}
          />
          
          <CardEstatistica
            titulo="Tempo Total"
            valor={gerais.tempoTotalFormatado}
            subtitulo="exercitando"
            icone="⏱️"
            cor={cores.secundaria}
          />
          
          <CardEstatistica
            titulo="Tempo Médio"
            valor={gerais.tempoMedioFormatado}
            subtitulo="por atividade"
            icone="📈"
            cor={cores.info}
          />
          
          <CardEstatistica
            titulo="Ao Ar Livre"
            valor={`${gerais.percentualAoArLivre}%`}
            subtitulo={`${gerais.atividadesAoArLivre} de ${gerais.totalAtividades} atividades`}
            icone="🌤️"
            cor={cores.sucesso}
          />
        </View>
      </SecaoEstatisticas>

      {/* Estatísticas de Distância */}
      {distancias && distancias.totalGeral > 0 && (
        <SecaoEstatisticas titulo="🏃 Distâncias Percorridas">
          <CardEstatistica
            titulo="Total Percorrido"
            valor={`${distancias.totalGeral} km`}
            subtitulo="em atividades com distância"
            icone="🛣️"
            cor={cores.aviso}
          />
          
          <View style={estilos.listaDistancias}>
            {Object.keys(distancias.porTipo).map(tipo => {
              const dados = distancias.porTipo[tipo];
              return (
                <View key={tipo} style={estilos.itemDistancia}>
                  <View style={estilos.infoDistancia}>
                    <Text style={estilos.tipoDistancia}>{tipo}</Text>
                    <Text style={estilos.detalhesDistancia}>
                      {dados.quantidade} atividade{dados.quantidade > 1 ? 's' : ''} • {dados.tempoTotalFormatado}
                    </Text>
                  </View>
                  <View style={estilos.valoresDistancia}>
                    <Text style={estilos.valorPrincipal}>{dados.distanciaTotal} km</Text>
                    <Text style={estilos.valorSecundario}>Média: {dados.distanciaMedia} km</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </SecaoEstatisticas>
      )}

      {/* Estatísticas por Tipo */}
      <SecaoEstatisticas titulo="🏋️ Por Tipo de Atividade">
        <View style={estilos.listaTipos}>
          {Object.keys(porTipo)
            .sort((a, b) => porTipo[b].quantidade - porTipo[a].quantidade) // Ordenar por quantidade
            .map(tipo => {
              const dados = porTipo[tipo];
              return (
                <View key={tipo} style={estilos.itemTipo}>
                  <View style={estilos.infoTipo}>
                    <Text style={estilos.nomeTipo}>{tipo}</Text>
                    <Text style={estilos.detalhesTipo}>
                      {dados.quantidade} atividade{dados.quantidade > 1 ? 's' : ''} • {dados.tempoMedioFormatado} em média
                    </Text>
                  </View>
                  <View style={estilos.valoresTipo}>
                    <Text style={estilos.tempoTipo}>{dados.tempoTotalFormatado}</Text>
                    {dados.temDistancia && dados.distanciaTotal > 0 && (
                      <Text style={estilos.distanciaTipo}>{dados.distanciaTotal} km</Text>
                    )}
                  </View>
                </View>
              );
            })}
        </View>
      </SecaoEstatisticas>

      {/* Períodos Mais Ativos */}
      {periodos && (periodos.diaMaisAtivo || periodos.semanaMaisAtiva) && (
        <SecaoEstatisticas titulo="📅 Períodos Mais Ativos">
          <View style={estilos.cardsContainer}>
            {periodos.diaMaisAtivo && (
              <CardEstatistica
                titulo="Dia Favorito"
                valor={periodos.diaMaisAtivo.dia}
                subtitulo={`${periodos.diaMaisAtivo.quantidade} atividades`}
                icone="📆"
                cor={cores.info}
              />
            )}
            
            {periodos.semanaMaisAtiva && (
              <CardEstatistica
                titulo="Semana Mais Ativa"
                valor={periodos.semanaMaisAtiva.periodo}
                subtitulo={`${periodos.semanaMaisAtiva.quantidade} atividades`}
                icone="🗓️"
                cor={cores.secundaria}
              />
            )}
          </View>

          {/* Distribuição por dia da semana */}
          {periodos.distribuicaoPorDia && (
            <View style={estilos.distribuicaoContainer}>
              <Text style={estilos.subtituloSecao}>Distribuição Semanal</Text>
              <View style={estilos.distribuicaoSemanal}>
                {Object.keys(periodos.distribuicaoPorDia).map(dia => (
                  <View key={dia} style={estilos.itemDia}>
                    <Text style={estilos.nomeDia}>{dia.substring(0, 3)}</Text>
                    <View style={[
                      estilos.barraDia, 
                      { 
                        height: Math.max(
                          (periodos.distribuicaoPorDia[dia] / Math.max(...Object.values(periodos.distribuicaoPorDia))) * 40,
                          5
                        )
                      }
                    ]} />
                    <Text style={estilos.quantidadeDia}>{periodos.distribuicaoPorDia[dia]}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </SecaoEstatisticas>
      )}

      {/* Footer com informações */}
      <View style={estilos.footer}>
        <Text style={estilos.footerTexto}>
          Última atualização: {new Date(estatisticas.calculadoEm).toLocaleString('pt-BR')}
        </Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Text style={estilos.footerLink}>🔄 Atualizar</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: cores.fundo,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: cores.textoSecundario,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: cores.fundo,
  },
  emptyIcone: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cores.texto,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitulo: {
    fontSize: 16,
    color: cores.textoSecundario,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  botaoNovaAtividade: {
    backgroundColor: cores.primaria,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  textoBotaoNovaAtividade: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secao: {
    margin: 20,
    marginBottom: 10,
  },
  tituloSecao: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 15,
  },
  subtituloSecao: {
    fontSize: 16,
    fontWeight: '600',
    color: cores.texto,
    marginTop: 20,
    marginBottom: 10,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardEstatistica: {
    backgroundColor: cores.fundoCartao,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    width: '48%',
    borderLeftWidth: 4,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcone: {
    fontSize: 16,
    marginRight: 8,
  },
  cardTitulo: {
    fontSize: 12,
    fontWeight: '600',
    color: cores.textoSecundario,
    flex: 1,
  },
  cardValor: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitulo: {
    fontSize: 11,
    color: cores.textoSecundario,
  },
  listaTipos: {
    backgroundColor: cores.fundoCartao,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },
  itemTipo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  infoTipo: {
    flex: 1,
  },
  nomeTipo: {
    fontSize: 16,
    fontWeight: '600',
    color: cores.texto,
    marginBottom: 4,
  },
  detalhesTipo: {
    fontSize: 12,
    color: cores.textoSecundario,
  },
  valoresTipo: {
    alignItems: 'flex-end',
  },
  tempoTipo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.primaria,
  },
  distanciaTipo: {
    fontSize: 12,
    color: cores.textoSecundario,
    marginTop: 2,
  },
  listaDistancias: {
    backgroundColor: cores.fundoCartao,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },
  itemDistancia: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  infoDistancia: {
    flex: 1,
  },
  tipoDistancia: {
    fontSize: 16,
    fontWeight: '600',
    color: cores.texto,
    marginBottom: 4,
  },
  detalhesDistancia: {
    fontSize: 12,
    color: cores.textoSecundario,
  },
  valoresDistancia: {
    alignItems: 'flex-end',
  },
  valorPrincipal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.aviso,
  },
  valorSecundario: {
    fontSize: 12,
    color: cores.textoSecundario,
    marginTop: 2,
  },
  distribuicaoContainer: {
    marginTop: 10,
  },
  distribuicaoSemanal: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: cores.fundoCartao,
    borderRadius: 12,
    padding: 15,
    height: 80,
    shadowColor: cores.sombra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: cores.sombraOpacidade,
    shadowRadius: 4,
    elevation: 3,
  },
  itemDia: {
    alignItems: 'center',
    flex: 1,
  },
  nomeDia: {
    fontSize: 10,
    color: cores.textoSecundario,
    marginBottom: 5,
  },
  barraDia: {
    width: 20,
    backgroundColor: cores.primaria,
    borderRadius: 2,
    marginBottom: 5,
  },
  quantidadeDia: {
    fontSize: 10,
    color: cores.texto,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
  },
  footerTexto: {
    fontSize: 12,
    color: cores.textoSecundario,
  },
  footerLink: {
    fontSize: 12,
    color: cores.primaria,
    fontWeight: 'bold',
  },
});