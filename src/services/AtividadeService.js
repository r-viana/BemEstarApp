import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { firestore, getUserId } from './FirebaseConfig';
import { sincronizarAtividadesStrava } from './StravaService';

// Mapeamento de ícones por tipo de atividade
const ICONES_ATIVIDADES = {
  'Caminhada & Corrida': '🏃‍♂️',
  'Ciclismo': '🚴‍♀️', 
  'Natação': '🏊‍♀️',
  'Musculação': '🏋️‍♀️',
  'Yoga': '🧘',
  'Pilates': '🤸‍♀️',
  'Dança': '💃',
  'Funcional': '🤾‍♀️',
  'Alongamento': '🤸‍♂️',
  'Relaxamento': '😌',
  'Meditação': '🧘‍♂️',
  'Leitura': '📚',
  'Terapia': '🗣️',
  'Aprendizado de nova habilidade': '🎓'
};

// Nome da coleção no Firestore
const COLECAO_ATIVIDADES = 'atividades';

/**
 * Obter ícone por tipo de atividade
 */
export const obterIconePorTipo = (tipo) => {
  return ICONES_ATIVIDADES[tipo] || '⚡'; // Ícone padrão
};

/**
 * Criar uma nova atividade
 */
export const criarAtividade = async (dadosAtividade) => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('Usuário não está logado');
    }

    // Validações básicas
    if (!dadosAtividade.type || !dadosAtividade.durationMinutes || !dadosAtividade.locationName) {
      throw new Error('Campos obrigatórios não preenchidos');
    }

    // Validar se a data não é no futuro
    const agora = new Date();
    const dataAtividade = new Date(dadosAtividade.date);
    if (dataAtividade > agora) {
      throw new Error('Não é possível cadastrar atividades futuras');
    }

    // Preparar dados para o Firestore
    const atividadeParaSalvar = {
      userId: userId,
      tipo: dadosAtividade.type,
      data: Timestamp.fromDate(dataAtividade),
      duracaoMinutos: parseInt(dadosAtividade.durationMinutes),
      local: dadosAtividade.locationName.trim(),
      isOutdoor: dadosAtividade.isOutdoor || false,
      distanciaKm: dadosAtividade.distanceKm || 0,
      notas: dadosAtividade.notes?.trim() || '',
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now()
    };

    // Salvar no Firestore
    const docRef = await addDoc(collection(firestore, COLECAO_ATIVIDADES), atividadeParaSalvar);
    
    console.log('Atividade criada com ID:', docRef.id);
    return { id: docRef.id, ...atividadeParaSalvar };

  } catch (error) {
    console.error('Erro ao criar atividade:', error);
    throw error;
  }
};

/**
 * Buscar todas as atividades do usuário logado
 */
export const buscarAtividadesDoUsuario = async () => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('Usuário não está logado');
    }

    // Query simplificada sem orderBy para evitar erro de índice
    const q = query(
      collection(firestore, COLECAO_ATIVIDADES),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const atividades = [];

    querySnapshot.forEach((doc) => {
      const dados = doc.data();
      
      // Converter Timestamp para Date
      const atividade = {
        id: doc.id,
        ...dados,
        data: dados.data.toDate(), // Converter Timestamp para Date
        criadoEm: dados.criadoEm.toDate(),
        atualizadoEm: dados.atualizadoEm.toDate()
      };
      
      atividades.push(atividade);
    });

    // Ordenar no cliente por data (mais recente primeiro)
    atividades.sort((a, b) => new Date(b.data) - new Date(a.data));

    console.log(`Encontradas ${atividades.length} atividades`);
    return atividades;

  } catch (error) {
    console.error('Erro ao buscar atividades:', error);
    throw error;
  }
};

/**
 * Atualizar uma atividade existente
 */
export const atualizarAtividade = async (idAtividade, dadosAtualizados) => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('Usuário não está logado');
    }

    // Validações básicas
    if (!dadosAtualizados.type || !dadosAtualizados.durationMinutes || !dadosAtualizados.locationName) {
      throw new Error('Campos obrigatórios não preenchidos');
    }

    // Validar se a data não é no futuro
    const agora = new Date();
    const dataAtividade = new Date(dadosAtualizados.date);
    if (dataAtividade > agora) {
      throw new Error('Não é possível cadastrar atividades futuras');
    }

    // Preparar dados atualizados
    const dadosParaAtualizar = {
      tipo: dadosAtualizados.type,
      data: Timestamp.fromDate(dataAtividade),
      duracaoMinutos: parseInt(dadosAtualizados.durationMinutes),
      local: dadosAtualizados.locationName.trim(),
      isOutdoor: dadosAtualizados.isOutdoor || false,
      distanciaKm: dadosAtualizados.distanceKm || 0,
      notas: dadosAtualizados.notes?.trim() || '',
      atualizadoEm: Timestamp.now()
      // Não atualizamos userId e criadoEm
    };

    // Atualizar no Firestore
    const docRef = doc(firestore, COLECAO_ATIVIDADES, idAtividade);
    await updateDoc(docRef, dadosParaAtualizar);

    console.log('Atividade atualizada:', idAtividade);
    return { id: idAtividade, ...dadosParaAtualizar };

  } catch (error) {
    console.error('Erro ao atualizar atividade:', error);
    throw error;
  }
};

/**
 * Excluir uma atividade
 */
export const excluirAtividade = async (idAtividade) => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('Usuário não está logado');
    }

    // Excluir do Firestore
    await deleteDoc(doc(firestore, COLECAO_ATIVIDADES, idAtividade));

    console.log('Atividade excluída:', idAtividade);
    return true;

  } catch (error) {
    console.error('Erro ao excluir atividade:', error);
    throw error;
  }
};

/**
 * Formatar atividade para exibição no componente ItemAtividade
 */
export const formatarAtividadeParaExibicao = (atividade) => {
  const icone = obterIconePorTipo(atividade.tipo);
  
  // Formatar detalhes (duração e distância)
  let detalhes = `${atividade.duracaoMinutos} min`;
  if (atividade.distanciaKm > 0) {
    detalhes += ` • ${atividade.distanciaKm} km`;
  }

  // Determinar tipo de ambiente - SEMPRE mostrar para todos os tipos
  const ambiente = atividade.isOutdoor ? 'Ao Ar Livre' : 'Ambiente Fechado';
  console.log(`Atividade: ${atividade.tipo}, isOutdoor: ${atividade.isOutdoor}, ambiente: ${ambiente}`);

  // Formatar data
  const dataFormatada = atividade.data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });

  return {
    id: atividade.id,
    tipo: atividade.tipo,
    icone: icone,
    detalhes: detalhes,
    ambiente: ambiente, // Novo campo para ambiente
    local: atividade.local,
    data: dataFormatada,
    // Manter dados originais para edição
    dadosOriginais: atividade
  };
};

/**
 * Sincronizar atividades do Strava
 */
export const sincronizarAtividadesDoStrava = async () => {
  try {
    console.log('Iniciando sincronização de atividades do Strava...');
    
    const resultado = await sincronizarAtividadesStrava(true);
    
    if (resultado.atividades && resultado.atividades.length > 0) {
      // Salvar atividades do Strava no Firebase
      const userId = getUserId();
      
      for (const atividadeStrava of resultado.atividades) {
        // Verificar se atividade já existe
        const q = query(
          collection(firestore, COLECAO_ATIVIDADES),
          where('userId', '==', userId),
          where('stravaId', '==', atividadeStrava.stravaId)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          // Atividade não existe, criar nova
          const atividadeParaSalvar = {
            userId: userId,
            tipo: atividadeStrava.tipo,
            data: Timestamp.fromDate(atividadeStrava.data),
            duracaoMinutos: atividadeStrava.duracaoMinutos,
            local: atividadeStrava.local,
            isOutdoor: atividadeStrava.isOutdoor,
            distanciaKm: atividadeStrava.distanciaKm,
            notas: atividadeStrava.notas,
            criadoEm: Timestamp.now(),
            atualizadoEm: Timestamp.now(),
            // Dados específicos do Strava
            stravaId: atividadeStrava.stravaId,
            stravaType: atividadeStrava.stravaType,
            stravaName: atividadeStrava.stravaName,
            fonte: 'strava',
            sincronizadoEm: Timestamp.now()
          };
          
          await addDoc(collection(firestore, COLECAO_ATIVIDADES), atividadeParaSalvar);
          console.log(`Atividade do Strava salva: ${atividadeStrava.stravaName}`);
        } else {
          console.log(`Atividade do Strava já existe: ${atividadeStrava.stravaName}`);
        }
      }
    }
    
    console.log('Sincronização do Strava concluída');
    return resultado;
    
  } catch (error) {
    console.error('Erro ao sincronizar atividades do Strava:', error);
    throw error;
  }
};

/**
 * Obter estatísticas das atividades do usuário
 */
export const obterEstatisticasUsuario = async () => {
  try {
    const atividades = await buscarAtividadesDoUsuario();
    
    const totalAtividades = atividades.length;
    const tempoTotalMinutos = atividades.reduce((total, atividade) => total + atividade.duracaoMinutos, 0);
    const distanciaTotalKm = atividades.reduce((total, atividade) => total + (atividade.distanciaKm || 0), 0);

    // Calcular dias consecutivos (simplificado - pode ser melhorado)
    const diasUnicos = new Set(
      atividades.map(atividade => 
        atividade.data.toISOString().split('T')[0]
      )
    );

    return {
      totalAtividades,
      tempoTotalMinutos,
      tempoTotalHoras: Math.round(tempoTotalMinutos / 60 * 10) / 10, // 1 casa decimal
      distanciaTotalKm,
      diasAtivos: diasUnicos.size
    };

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return {
      totalAtividades: 0,
      tempoTotalMinutos: 0,
      tempoTotalHoras: 0,
      distanciaTotalKm: 0,
      diasAtivos: 0
    };
  }
};

export default {
  criarAtividade,
  buscarAtividadesDoUsuario,
  atualizarAtividade,
  excluirAtividade,
  obterIconePorTipo,
  formatarAtividadeParaExibicao,
  obterEstatisticasUsuario,
  sincronizarAtividadesDoStrava
};