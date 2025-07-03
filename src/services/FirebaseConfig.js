import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuração do Firebase e credenciais

const firebaseConfig = {
  apiKey: "AIzaSyB4Ol1UzVaK9xehy0E4u0ekjbsv3lK-TVA",
  authDomain: "bem-estar-app-4fb14.firebaseapp.com",
  projectId: "bem-estar-app-4fb14",
  storageBucket: "bem-estar-app-4fb14.firebasestorage.app",
  messagingSenderId: "767114686369",
  appId: "1:767114686369:web:49490c9a46657e203965e0",
  measurementId: "G-DR08Y78DBQ"
};

//firebase 
const app = initializeApp(firebaseConfig);

//serviços
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export default app;
