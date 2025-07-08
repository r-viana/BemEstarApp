import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Chave para storage da foto
const AVATAR_STORAGE_KEY = 'userAvatar';

// Gerar iniciais do nome
export const gerarIniciais = (nomeCompleto) => {
  if (!nomeCompleto || nomeCompleto.trim() === '') {
    return '=)'; // Default: =) carinha feliz
  }

  const palavras = nomeCompleto.trim().split(' ');
  
  if (palavras.length === 1) {
    // Só um nome: primeira letra
    return palavras[0].charAt(0).toUpperCase();
  } else {
    // Primeiro nome + último nome
    const primeiro = palavras[0].charAt(0).toUpperCase();
    const ultimo = palavras[palavras.length - 1].charAt(0).toUpperCase();
    return primeiro + ultimo;
  }
};

// Gerar cor de fundo baseada no nome
export const gerarCorAvatar = (nomeCompleto) => {
  const cores = [
    '#FF6B6B', // Vermelho
    '#4ECDC4', // Turquesa
    '#45B7D1', // Azul
    '#96CEB4', // Verde
    '#FECA57', // Amarelo
    '#FF9FF3', // Rosa
    '#54A0FF', // Azul claro
    '#5F27CD', // Roxo
    '#00D2D3', // Ciano
    '#FF9F43', // Laranja
  ];

  if (!nomeCompleto) {
    return cores[0];
  }

  // hash simples para escolher cor 
  let hash = 0;
  for (let i = 0; i < nomeCompleto.length; i++) {
    hash = nomeCompleto.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const indice = Math.abs(hash) % cores.length;
  return cores[indice];
};

// Salvar foto do avatar
export const salvarFotoAvatar = async (imageUri) => {
  try {
    if (!imageUri) {
      throw new Error('URI da imagem não fornecida');
    }

    console.log('Salvando foto do avatar:', imageUri);
    
    // Salvar URI da imagem localmente
    await AsyncStorage.setItem(AVATAR_STORAGE_KEY, imageUri);
    
    console.log('Foto do avatar salva com sucesso');
    return true;

  } catch (error) {
    console.error('Erro ao salvar foto do avatar:', error);
    throw error;
  }
};

// Carregar foto do avatar
export const carregarFotoAvatar = async () => {
  try {
    const imageUri = await AsyncStorage.getItem(AVATAR_STORAGE_KEY);
    
    if (imageUri) {
      console.log('Foto do avatar carregada:', imageUri);
      return imageUri;
    } else {
      console.log('Nenhuma foto de avatar encontrada');
      return null;
    }

  } catch (error) {
    console.error('Erro ao carregar foto do avatar:', error);
    return null;
  }
};

// Remover foto do avatar
export const removerFotoAvatar = async () => {
  try {
    await AsyncStorage.removeItem(AVATAR_STORAGE_KEY);
    console.log('Foto do avatar removida');
    return true;

  } catch (error) {
    console.error('Erro ao remover foto do avatar:', error);
    return false;
  }
};

// Validar se arquivo é uma imagem válida
export const validarImagem = (imageUri) => {
  if (!imageUri) {
    return { valida: false, erro: 'URI da imagem não fornecida' };
  }

  // Verificar extensões válidas
  const extensoesValidas = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const extensao = imageUri.toLowerCase();
  
  const temExtensaoValida = extensoesValidas.some(ext => extensao.includes(ext));
  
  if (!temExtensaoValida) {
    return { valida: false, erro: 'Formato de imagem não suportado' };
  }

  return { valida: true, erro: null };
};

// Comprimir imagem simulado 
export const comprimirImagem = async (imageUri) => {
  try {
    // Por enquanto, retorna a URI original
    // Em produção, aqui faria a compressão real
    console.log('Imagem "comprimida":', imageUri);
    return imageUri;

  } catch (error) {
    console.error('Erro ao comprimir imagem:', error);
    throw error;
  }
};

// Obter dados completos do avatar
export const obterDadosAvatar = async (nomeCompleto) => {
  try {
    const fotoUri = await carregarFotoAvatar();
    
    return {
      temFoto: !!fotoUri,
      fotoUri: fotoUri,
      iniciais: gerarIniciais(nomeCompleto),
      corFundo: gerarCorAvatar(nomeCompleto)
    };

  } catch (error) {
    console.error('Erro ao obter dados do avatar:', error);
    return {
      temFoto: false,
      fotoUri: null,
      iniciais: gerarIniciais(nomeCompleto),
      corFundo: gerarCorAvatar(nomeCompleto)
    };
  }
};

// Configurar imagem do avatar (com validação e compressão)
export const configurarAvatar = async (imageUri) => {
  try {
    // Validar imagem
    const validacao = validarImagem(imageUri);
    if (!validacao.valida) {
      throw new Error(validacao.erro);
    }

    // Comprimir imagem
    const imagemComprimida = await comprimirImagem(imageUri);
    
    // Salvar imagem
    await salvarFotoAvatar(imagemComprimida);
    
    return true;

  } catch (error) {
    console.error('Erro ao configurar avatar:', error);
    Alert.alert('Erro', `Não foi possível configurar o avatar: ${error.message}`);
    return false;
  }
};

export default {
  gerarIniciais,
  gerarCorAvatar,
  salvarFotoAvatar,
  carregarFotoAvatar,
  removerFotoAvatar,
  validarImagem,
  comprimirImagem,
  obterDadosAvatar,
  configurarAvatar
};