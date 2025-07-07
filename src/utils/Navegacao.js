import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { cores } from './Cores';

// Import de telas

import Cadastro from '../views/screens/Cadastro';
import HealthTracker from '../views/screens/HealthTracker';
import Login from '../views/screens/Login';
import Perfil from '../views/screens/Perfil';
import Principal from '../views/screens/Principal';
import RecuperarSenha from '../views/screens/RecuperarSenha';
import VerificarEmail from '../views/screens/VerificarEmail';
import HistoricoDeAtividades from '../views/screens/HistoricoDeAtividades';



// Criar o stack navigator
const Stack = createNativeStackNavigator();

export default function Navegacao() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false, // Remove o header padrão
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={Login}
        />
        <Stack.Screen 
          name="Cadastro" 
          component={Cadastro}
        />
        <Stack.Screen 
          name="Principal" 
          component={Principal}
        />
        <Stack.Screen
          name="VerificarEmail"
          component={VerificarEmail}
          options={{title: 'Verificar Email'}}
        />

        <Stack.Screen
          name="RecuperarSenha"
          component={RecuperarSenha}
          options={{ title: 'Recuperar Senha' }}
        />
         <Stack.Screen
        name="Perfil"
        component={Perfil}
        options={{title: 'Meu Perfil',
          headerStyle: { backgroundColor: cores.primaria },
          headerTintColor: cores.branco,
          headerTitleStyle: { fontWeight: 'bold'}
        }}
        />
        <Stack.Screen
          name="HealthTracker"
          component={HealthTracker}
          options={{ title: 'Health Tracker' }}
        />
        <Stack.Screen
          name="HistoricoDeAtividades"
          component={HistoricoDeAtividades}
          options={{
            headerShown: true, // Mostra o header com botão de voltar
            title: 'Histórico de Atividades',
            headerStyle: { backgroundColor: cores.primaria },
            headerTintColor: cores.branco,
            headerTitleStyle: { fontWeight: 'bold' }
          }}
        />

        {/* Rotas temporárias - criar as telas depois */}
{/* 
        
        <Stack.Screen
        name="RegistroAtividades"
        component={RegistroAtividades}
        options={{ title: 'Registro de Atividades' }}
        />
        <Stack.Screen
        name="Configuracoes"
        component={Configuracoes}
        options={{ title: 'Configurações' }}
        />
        <Stack.Screen
        name="Estatisticas"
        component={Estatisticas}
        options={{ title: 'Estatísticas' }}
        />
*/}


      </Stack.Navigator>
    </NavigationContainer>
  );
}
