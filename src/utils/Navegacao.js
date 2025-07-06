import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import de telas
import Login from '../views/screens/Login';
import Cadastro from '../views/screens/Cadastro';
import Principal from '../views/screens/Principal';
import VerificarEmail from '../views/screens/VerificarEmail';
import RecuperarSenha from '../views/screens/RecuperarSenha';


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

      </Stack.Navigator>
    </NavigationContainer>
  );
}
