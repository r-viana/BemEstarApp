import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuração do Firebase com as novas credenciais
const firebaseConfig = {
  apiKey: "AIzaSyDUpg5E2BJBh1piFWqFbsJedUquXbnU0r8",
  authDomain: "bem-estar-app-f4ac1.firebaseapp.com",
  projectId: "bem-estar-app-f4ac1",
  storageBucket: "bem-estar-app-f4ac1.firebasestorage.app",
  messagingSenderId: "385855823407",
  appId: "1:385855823407:android:42131c2a9544c6dcccb0da"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Serviços
export const auth = getAuth(app);
export const firestore = getFirestore(app);

// Coleções do Firestore
export const COLLECTIONS = {
  USERS: 'users',
  OBJETIVOS: 'objetivos'
};

// Funções utilitárias
export const getCurrentUser = () => {
  return auth.currentUser;
};

export const isUserLoggedIn = () => {
  return auth.currentUser !== null;
};

export const getUserId = () => {
  const user = getCurrentUser();
  return user ? user.uid : null;
};

export const onAuthStateChanged = (callback) => {
  return auth.onAuthStateChanged(callback);
};

export default app;
