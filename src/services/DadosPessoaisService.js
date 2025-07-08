import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  doc, 
  getDoc, 
  setDoc, 
  Timestamp 
} from 'firebase/firestore';
import { firestore, getUserId, getCurrentUser } from './FirebaseConfig';

// Chave para storage local
const STORAGE_KEY = 'dadosPessoais';

// Opções predefinidas para seletores
export const OPCOES_SEXO = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
  { value: 'nao_informar', label: 'Prefiro não informar' }
];

export const OPCOES_EXPERIENCIA = [
  { 
    value: 'iniciante', 
    label: 'Iniciante',
    descricao: 'Estou começando minha jornada fitness'
  },
  { 
    value: 'intermediario', 
    label: 'Intermediário',
    descricao: 'Faço atividades algumas vezes por semana'
  },
  { 
    value: 'avancado', 
    label: 'Avançado',
    descricao: 'Atividade física faz parte da minha rotina diária'
  }
];

// Estrutura padrão dos dados pessoais
const criarEstruturaPadrao = () => {
  const user = getCurrentUser();
  return {
    // Dados já existentes no perfil (nome e email) e os que foram adicionados depois...
    nome: user?.displayName || '',
    email: user?.email || '', 
    dataNascimento: null,
    sexo: '',
    peso: '',
    altura: '',
    cidade: '',
    estado: '',
    nivelExperiencia: '',
    
    // Metadados para sincronização
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    userId: getUserId()
  };
};

// Validar dados antes de salvar
export const validarDadosPessoais = (dados) => {
  const erros = [];

  // Validar data de nascimento
  if (dados.dataNascimento) {
    const nascimento = new Date(dados.dataNascimento);
    const hoje = new Date();
    const idade = hoje.getFullYear() - nascimento.getFullYear();
    
    if (idade < 13 || idade > 100) {
      erros.push('Idade deve estar entre 13 e 100 anos');
    }
  }

  // Validar peso
  if (dados.peso) {
    const pesoNum = parseFloat(dados.peso.toString().replace(',', '.'));
    if (isNaN(pesoNum) || pesoNum < 30 || pesoNum > 300) {
      erros.push('Peso deve estar entre 30 e 300 kg');
    }
  }

  // Validar altura
  if (dados.altura) {
    const alturaNum = parseFloat(dados.altura.toString().replace(',', '.'));
    if (isNaN(alturaNum) || alturaNum < 100 || alturaNum > 250) {
      erros.push('Altura deve estar entre 100 e 250 cm');
    }
  }

  // Validar cidade e estado
  if (dados.cidade && dados.cidade.trim().length < 2) {
    erros.push('Cidade deve ter pelo menos 2 caracteres');
  }
  
  if (dados.estado && dados.estado.trim().length < 2) {
    erros.push('Estado deve ter pelo menos 2 caracteres');
  }

  // Validar opções predefinidas
  if (dados.sexo && !OPCOES_SEXO.find(opcao => opcao.value === dados.sexo)) {
    erros.push('Sexo deve ser uma opção válida');
  }

  if (dados.nivelExperiencia && !OPCOES_EXPERIENCIA.find(opcao => opcao.value === dados.nivelExperiencia)) {
    erros.push('Nível de experiência deve ser uma opção válida');
  }

  return erros;
};

// Salvar dados pessoais (storage híbrido)
export const salvarDadosPessoais = async (novosDados) => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('Usuário não está logado');
    }

    // Validar dados antes de salvar
    const erros = validarDadosPessoais(novosDados);
    if (erros.length > 0) {
      throw new Error(erros.join(', '));
    }

    // Preparar dados com metadados
    const dadosCompletos = {
      ...novosDados,
      userId,
      atualizadoEm: new Date().toISOString()
    };

    console.log('Salvando dados pessoais:', dadosCompletos);

    // 1. SEMPRE salvar localmente primeiro (garantia)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dadosCompletos));
    console.log('Dados salvos localmente');

    // 2. Tentar salvar no Firebase (se tiver internet)
    try {
      const userDocRef = doc(firestore, 'users', userId);
      await setDoc(userDocRef, {
        dadosPessoais: {
          ...dadosCompletos,
          atualizadoEm: Timestamp.now() // Usar Timestamp do Firebase
        }
      }, { merge: true });
      
      console.log('Dados sincronizados com Firebase');
    } catch (firebaseError) {
      console.log('Erro ao sincronizar com Firebase (dados salvos localmente):', firebaseError);
      // Não falha se Firebase der erro - dados ficam salvos localmente
    }

    return dadosCompletos;

  } catch (error) {
    console.error('Erro ao salvar dados pessoais:', error);
    throw error;
  }
};

// Carregar dados pessoais (storage híbrido)
export const carregarDadosPessoais = async () => {
  try {
    const userId = getUserId();
    if (!userId) {
      console.log('Usuário não logado, retornando estrutura padrão');
      return criarEstruturaPadrao();
    }

    // 1. Carregar dados locais primeiro (rápido)
    let dadosLocais = null;
    try {
      const dadosLocaisString = await AsyncStorage.getItem(STORAGE_KEY);
      if (dadosLocaisString) {
        dadosLocais = JSON.parse(dadosLocaisString);
        console.log('Dados locais carregados');
      }
    } catch (error) {
      console.log('Erro ao carregar dados locais:', error);
    }

    // 2. Tentar buscar dados do Firebase (se tiver internet)
    let dadosFirebase = null;
    try {
      const userDocRef = doc(firestore, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists() && docSnap.data().dadosPessoais) {
        dadosFirebase = docSnap.data().dadosPessoais;
        // Converter Timestamp para string
        if (dadosFirebase.atualizadoEm && dadosFirebase.atualizadoEm.toDate) {
          dadosFirebase.atualizadoEm = dadosFirebase.atualizadoEm.toDate().toISOString();
        }
        console.log('Dados do Firebase carregados');
      }
    } catch (error) {
      console.log('Erro ao carregar dados do Firebase (usando dados locais):', error);
    }

    // 3. Decidir quais dados usar (mais recentes)
    let dadosFinais;

    if (dadosFirebase && dadosLocais) {
      // Comparar timestamps para usar dados mais recentes
      const timestampFirebase = new Date(dadosFirebase.atualizadoEm).getTime();
      const timestampLocal = new Date(dadosLocais.atualizadoEm).getTime();
      
      if (timestampFirebase > timestampLocal) {
        console.log('Usando dados do Firebase (mais recentes)');
        dadosFinais = dadosFirebase;
        // Atualizar dados locais com versão mais recente
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dadosFirebase));
      } else {
        console.log('Usando dados locais (mais recentes ou iguais)');
        dadosFinais = dadosLocais;
      }
    } else if (dadosFirebase) {
      console.log('Usando dados do Firebase (únicos disponíveis)');
      dadosFinais = dadosFirebase;
      // Salvar localmente para próximas vezes
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dadosFirebase));
    } else if (dadosLocais) {
      console.log('Usando dados locais (únicos disponíveis)');
      dadosFinais = dadosLocais;
    } else {
      console.log('Nenhum dado encontrado, criando estrutura padrão');
      dadosFinais = criarEstruturaPadrao();
    }

    return dadosFinais;

  } catch (error) {
    console.error('Erro ao carregar dados pessoais:', error);
    // Em caso de erro, retorna estrutura padrão
    return criarEstruturaPadrao();
  }
};

// Limpar dados pessoais (logout)
export const limparDadosPessoais = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('Dados pessoais locais removidos');
  } catch (error) {
    console.error('Erro ao limpar dados pessoais:', error);
  }
};

// Verificar se dados pessoais estão completos
export const verificarDadosCompletos = (dados) => {
  const camposObrigatorios = ['nome', 'email'];
  const camposOpcionais = ['dataNascimento', 'sexo', 'peso', 'altura', 'cidade', 'estado', 'nivelExperiencia'];
  
  const obrigatoriosPreenchidos = camposObrigatorios.every(campo => 
    dados[campo] && dados[campo].toString().trim().length > 0
  );
  
  const opcionaisPreenchidos = camposOpcionais.filter(campo => 
    dados[campo] && dados[campo].toString().trim().length > 0
  ).length;
  
  return {
    obrigatoriosCompletos: obrigatoriosPreenchidos,
    percentualCompleto: Math.round(((obrigatoriosPreenchidos ? camposObrigatorios.length : 0) + opcionaisPreenchidos) / (camposObrigatorios.length + camposOpcionais.length) * 100),
    totalCampos: camposObrigatorios.length + camposOpcionais.length,
    camposPreenchidos: (obrigatoriosPreenchidos ? camposObrigatorios.length : 0) + opcionaisPreenchidos
  };
};

export default {
  salvarDadosPessoais,
  carregarDadosPessoais,
  limparDadosPessoais,
  validarDadosPessoais,
  verificarDadosCompletos,
  OPCOES_SEXO,
  OPCOES_EXPERIENCIA
};