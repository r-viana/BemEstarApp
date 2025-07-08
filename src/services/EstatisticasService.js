import { buscarAtividadesDoUsuario } from './AtividadeService';

// Atividades que podem ter distância
const ATIVIDADES_COM_DISTANCIA = ['Caminhada & Corrida', 'Ciclismo', 'Natação'];

// Função para calcular streak (dias consecutivos) real
export const calcularStreakAtual = async () => {
  try {
    console.log('Calculando streak atual...');
    const atividades = await buscarAtividadesDoUsuario();
    
    if (atividades.length === 0) {
      return {
        diasConsecutivos: 0,
        recordeDias: 0,
        ultimaAtividade: null
      };
    }
// Ordenar atividades por data (mais recente primeiro)
    const atividadesOrdenadas = atividades.sort((a, b) => new Date(b.data) - new Date(a.data));

    // Agrupar atividades por dia (ignorar horário)
    const diasComAtividade = new Set();
    atividadesOrdenadas.forEach(atividade => {
      const dataString = atividade.data.toISOString().split('T')[0]; // YYYY-MM-DD
      diasComAtividade.add(dataString);
    });

    // Converter para array e ordenar (mais recente primeiro)
    const diasUnicos = Array.from(diasComAtividade).sort((a, b) => new Date(b) - new Date(a));

    // Calcular streak atual
    let streakAtual = 0;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zerar horário para comparação só de data
    
    for (let i = 0; i < diasUnicos.length; i++) {
      const diaAtividade = new Date(diasUnicos[i]);
      const diferencaDias = Math.floor((hoje - diaAtividade) / (1000 * 60 * 60 * 24));
      
      if (i === 0) {
        // Primeira atividade - deve ser hoje ou ontem para contar streak
        if (diferencaDias <= 1) {
          streakAtual = 1;
        } else {
          break; // Streak quebrado
        }
      } else {
        // Próximas atividades devem ser consecutivas
        const diaAnterior = new Date(diasUnicos[i - 1]);
        const diferencaEntreDias = Math.floor((diaAnterior - diaAtividade) / (1000 * 60 * 60 * 24));
        
        if (diferencaEntreDias === 1) {
          streakAtual++;
        } else {
          break; // Streak quebrado
        }
      }
    }
    
    // Calcular recorde histórico (maior sequência já alcançada)
    let recordeHistorico = 0;
    let streakTemporario = 0;
    
    // Percorrer todos os dias únicos para encontrar a maior sequência
    for (let i = diasUnicos.length - 1; i >= 0; i--) {
      if (i === diasUnicos.length - 1) {
        streakTemporario = 1;
      } else {
        const diaAtual = new Date(diasUnicos[i]);
        const diaAnterior = new Date(diasUnicos[i + 1]);
        const diferencaDias = Math.floor((diaAtual - diaAnterior) / (1000 * 60 * 60 * 24));
        
        if (diferencaDias === 1) {
          streakTemporario++;
        } else {
          recordeHistorico = Math.max(recordeHistorico, streakTemporario);
          streakTemporario = 1;
        }
      }
    }
    recordeHistorico = Math.max(recordeHistorico, streakTemporario);
    
    const resultado = {
      diasConsecutivos: streakAtual,
      recordeDias: Math.max(recordeHistorico, streakAtual), // Recorde nunca pode ser menor que streak atual
      ultimaAtividade: atividadesOrdenadas[0]?.data || null,
      totalDiasAtivos: diasUnicos.length
    };

    console.log('Streak calculado:', resultado);
    return resultado;

  } catch (error) {
    console.error('Erro ao calcular streak:', error);
    return {
      diasConsecutivos: 0,
      recordeDias: 0,
      ultimaAtividade: null
    };
  }
};

// Função auxiliar para formatar tempo
const formatarTempo = (minutos) => {
  if (minutos < 60) {
    return `${minutos}min`;
  }
  
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  
  if (minutosRestantes === 0) {
    return `${horas}h`;
  }
  
  return `${horas}h ${minutosRestantes}min`;
};

// Função auxiliar para obter nome do dia da semana
const obterNomeDiaSemana = (data) => {
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return diasSemana[data.getDay()];
};

// Função auxiliar para obter semana do ano
const obterSemanaDoAno = (data) => {
  const startDate = new Date(data.getFullYear(), 0, 1);
  const days = Math.floor((data - startDate) / (24 * 60 * 60 * 1000));
  return Math.ceil(days / 7);
};

// Calcular estatísticas gerais
export const calcularEstatisticasGerais = async () => {
  try {
    console.log('Calculando estatísticas gerais...');
    const atividades = await buscarAtividadesDoUsuario();
    
    if (atividades.length === 0) {
      return {
        tempoTotal: 0,
        tempoTotalFormatado: '0min',
        tempoMedio: 0,
        tempoMedioFormatado: '0min',
        totalAtividades: 0,
        atividadesAoArLivre: 0,
        atividadesAmbienteFechado: 0,
        percentualAoArLivre: 0
      };
    }

    // Cálculos básicos
    const tempoTotal = atividades.reduce((total, atividade) => total + atividade.duracaoMinutos, 0);
    const tempoMedio = Math.round(tempoTotal / atividades.length);
    
    // Contar atividades por ambiente
    const atividadesAoArLivre = atividades.filter(atividade => atividade.isOutdoor).length;
    const atividadesAmbienteFechado = atividades.length - atividadesAoArLivre;
    const percentualAoArLivre = Math.round((atividadesAoArLivre / atividades.length) * 100);

    const resultado = {
      tempoTotal,
      tempoTotalFormatado: formatarTempo(tempoTotal),
      tempoMedio,
      tempoMedioFormatado: formatarTempo(tempoMedio),
      totalAtividades: atividades.length,
      atividadesAoArLivre,
      atividadesAmbienteFechado,
      percentualAoArLivre
    };

    console.log('Estatísticas gerais calculadas:', resultado);
    return resultado;

  } catch (error) {
    console.error('Erro ao calcular estatísticas gerais:', error);
    return null;
  }
};

// Calcular estatísticas por tipo de atividade
export const calcularEstatisticasPorTipo = async () => {
  try {
    console.log('Calculando estatísticas por tipo...');
    const atividades = await buscarAtividadesDoUsuario();
    
    if (atividades.length === 0) {
      return {};
    }

    // Agrupar atividades por tipo
    const atividadesPorTipo = atividades.reduce((grupos, atividade) => {
      const tipo = atividade.tipo;
      if (!grupos[tipo]) {
        grupos[tipo] = [];
      }
      grupos[tipo].push(atividade);
      return grupos;
    }, {});

    // Calcular estatísticas para cada tipo
    const estatisticasPorTipo = {};
    
    Object.keys(atividadesPorTipo).forEach(tipo => {
      const atividadesDoTipo = atividadesPorTipo[tipo];
      const tempoTotal = atividadesDoTipo.reduce((total, atividade) => total + atividade.duracaoMinutos, 0);
      const tempoMedio = Math.round(tempoTotal / atividadesDoTipo.length);
      
      // Calcular distância se aplicável
      let distanciaTotal = 0;
      let distanciaMedia = 0;
      
      if (ATIVIDADES_COM_DISTANCIA.includes(tipo)) {
        const atividadesComDistancia = atividadesDoTipo.filter(atividade => atividade.distanciaKm > 0);
        if (atividadesComDistancia.length > 0) {
          distanciaTotal = atividadesComDistancia.reduce((total, atividade) => total + atividade.distanciaKm, 0);
          distanciaMedia = Math.round((distanciaTotal / atividadesComDistancia.length) * 10) / 10; // 1 casa decimal
        }
      }

      estatisticasPorTipo[tipo] = {
        quantidade: atividadesDoTipo.length,
        tempoTotal,
        tempoTotalFormatado: formatarTempo(tempoTotal),
        tempoMedio,
        tempoMedioFormatado: formatarTempo(tempoMedio),
        distanciaTotal: Math.round(distanciaTotal * 10) / 10, // 1 casa decimal
        distanciaMedia,
        temDistancia: ATIVIDADES_COM_DISTANCIA.includes(tipo)
      };
    });

    console.log('Estatísticas por tipo calculadas:', estatisticasPorTipo);
    return estatisticasPorTipo;

  } catch (error) {
    console.error('Erro ao calcular estatísticas por tipo:', error);
    return {};
  }
};

// Calcular dia e semana mais ativos
export const calcularPeriodosMaisAtivos = async () => {
  try {
    console.log('Calculando períodos mais ativos...');
    const atividades = await buscarAtividadesDoUsuario();
    
    if (atividades.length === 0) {
      return {
        diaMaisAtivo: null,
        semanaMaisAtiva: null
      };
    }

    // Agrupar por dia da semana
    const atividadesPorDiaSemana = atividades.reduce((grupos, atividade) => {
      const diaSemana = obterNomeDiaSemana(atividade.data);
      if (!grupos[diaSemana]) {
        grupos[diaSemana] = 0;
      }
      grupos[diaSemana]++;
      return grupos;
    }, {});

    // Encontrar dia mais ativo
    const diaMaisAtivo = Object.keys(atividadesPorDiaSemana).reduce((a, b) => 
      atividadesPorDiaSemana[a] > atividadesPorDiaSemana[b] ? a : b
    );

    // Agrupar por semana do ano
    const atividadesPorSemana = atividades.reduce((grupos, atividade) => {
      const ano = atividade.data.getFullYear();
      const semana = obterSemanaDoAno(atividade.data);
      const chave = `${ano}-S${semana}`;
      
      if (!grupos[chave]) {
        grupos[chave] = {
          quantidade: 0,
          periodo: `Semana ${semana} de ${ano}`
        };
      }
      grupos[chave].quantidade++;
      return grupos;
    }, {});

    // Encontrar semana mais ativa
    const chaveSemanaMaisAtiva = Object.keys(atividadesPorSemana).reduce((a, b) => 
      atividadesPorSemana[a].quantidade > atividadesPorSemana[b].quantidade ? a : b
    );

    const resultado = {
      diaMaisAtivo: {
        dia: diaMaisAtivo,
        quantidade: atividadesPorDiaSemana[diaMaisAtivo]
      },
      semanaMaisAtiva: {
        periodo: atividadesPorSemana[chaveSemanaMaisAtiva].periodo,
        quantidade: atividadesPorSemana[chaveSemanaMaisAtiva].quantidade
      },
      distribuicaoPorDia: atividadesPorDiaSemana
    };

    console.log('Períodos mais ativos calculados:', resultado);
    return resultado;

  } catch (error) {
    console.error('Erro ao calcular períodos mais ativos:', error);
    return {
      diaMaisAtivo: null,
      semanaMaisAtiva: null
    };
  }
};

// Calcular estatísticas detalhadas para atividades com distância
export const calcularEstatisticasDistancia = async () => {
  try {
    console.log('Calculando estatísticas de distância...');
    const atividades = await buscarAtividadesDoUsuario();
    
    // Filtrar apenas atividades com distância
    const atividadesComDistancia = atividades.filter(atividade => 
      ATIVIDADES_COM_DISTANCIA.includes(atividade.tipo) && atividade.distanciaKm > 0
    );

    if (atividadesComDistancia.length === 0) {
      return {
        totalGeral: 0,
        porTipo: {}
      };
    }

    // Calcular total geral
    const distanciaTotal = atividadesComDistancia.reduce((total, atividade) => 
      total + atividade.distanciaKm, 0
    );

    // Agrupar por tipo e calcular estatísticas
    const estatisticasPorTipo = {};
    
    ATIVIDADES_COM_DISTANCIA.forEach(tipo => {
      const atividadesDoTipo = atividadesComDistancia.filter(atividade => atividade.tipo === tipo);
      
      if (atividadesDoTipo.length > 0) {
        const distanciaTotalTipo = atividadesDoTipo.reduce((total, atividade) => 
          total + atividade.distanciaKm, 0
        );
        const tempoTotalTipo = atividadesDoTipo.reduce((total, atividade) => 
          total + atividade.duracaoMinutos, 0
        );
        const distanciaMedia = distanciaTotalTipo / atividadesDoTipo.length;
        const tempoMedio = Math.round(tempoTotalTipo / atividadesDoTipo.length);

        estatisticasPorTipo[tipo] = {
          quantidade: atividadesDoTipo.length,
          distanciaTotal: Math.round(distanciaTotalTipo * 10) / 10, // 1 casa decimal
          distanciaMedia: Math.round(distanciaMedia * 10) / 10, // 1 casa decimal
          tempoTotal: tempoTotalTipo,
          tempoTotalFormatado: formatarTempo(tempoTotalTipo),
          tempoMedio,
          tempoMedioFormatado: formatarTempo(tempoMedio)
        };
      }
    });

    const resultado = {
      totalGeral: Math.round(distanciaTotal * 10) / 10, // 1 casa decimal
      porTipo: estatisticasPorTipo
    };

    console.log('Estatísticas de distância calculadas:', resultado);
    return resultado;

  } catch (error) {
    console.error('Erro ao calcular estatísticas de distância:', error);
    return {
      totalGeral: 0,
      porTipo: {}
    };
  }
};

// Calcular todas as estatísticas de uma vez
export const calcularTodasEstatisticas = async () => {
  try {
    console.log('Calculando todas as estatísticas...');
    
    // Executar todos os cálculos em paralelo para melhor performance
    const [
      estatisticasGerais,
      estatisticasPorTipo,
      periodosMaisAtivos,
      estatisticasDistancia
    ] = await Promise.all([
      calcularEstatisticasGerais(),
      calcularEstatisticasPorTipo(),
      calcularPeriodosMaisAtivos(),
      calcularEstatisticasDistancia()
    ]);

    const resultado = {
      gerais: estatisticasGerais,
      porTipo: estatisticasPorTipo,
      periodos: periodosMaisAtivos,
      distancias: estatisticasDistancia,
      calculadoEm: new Date().toISOString()
    };

    console.log('Todas as estatísticas calculadas:', resultado);
    return resultado;

  } catch (error) {
    console.error('Erro ao calcular todas as estatísticas:', error);
    return null;
  }
};

// Função para cache de estatísticas (otimização)
let cacheEstatisticas = null;
let ultimoCalculoEstatisticas = null;

export const obterEstatisticasComCache = async (forcarRecalculo = false) => {
  try {
    const agora = new Date().getTime();
    const CACHE_DURACAO = 5 * 60 * 1000; // 5 minutos

    // Verificar se cache é válido
    if (!forcarRecalculo && cacheEstatisticas && ultimoCalculoEstatisticas) {
      const idadeCache = agora - ultimoCalculoEstatisticas;
      if (idadeCache < CACHE_DURACAO) {
        console.log('Usando estatísticas do cache');
        return cacheEstatisticas;
      }
    }

    // Recalcular estatísticas
    console.log('Recalculando estatísticas...');
    const novasEstatisticas = await calcularTodasEstatisticas();
    
    if (novasEstatisticas) {
      cacheEstatisticas = novasEstatisticas;
      ultimoCalculoEstatisticas = agora;
    }

    return novasEstatisticas;

  } catch (error) {
    console.error('Erro ao obter estatísticas com cache:', error);
    return cacheEstatisticas; // Retorna cache antigo se houver erro
  }
};

// Limpar cache (usar quando dados mudarem)
export const limparCacheEstatisticas = () => {
  console.log('Cache de estatísticas limpo');
  cacheEstatisticas = null;
  ultimoCalculoEstatisticas = null;
};

export default {
  calcularEstatisticasGerais,
  calcularEstatisticasPorTipo,
  calcularPeriodosMaisAtivos,
  calcularEstatisticasDistancia,
  calcularTodasEstatisticas,
  obterEstatisticasComCache,
  limparCacheEstatisticas
};