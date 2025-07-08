import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text, View } from 'react-native';
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
import Configuracoes from '../views/screens/Configuracoes';
import TelaFormularioDeAtividade from '../views/screens/TelaFormularioDeAtividade';
import Estatisticas from '../views/screens/Estatisticas';

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
        options={{
          title: 'Meu Perfil',
          headerShown: true,
          headerStyle: { backgroundColor: cores.primaria },
          headerTintColor: cores.branco,
          headerTitleStyle: { fontWeight: 'bold'}
        }}
        />
        <Stack.Screen
          name="HealthTracker"
          component={HealthTracker}
          options={{ 
            title: 'Health Tracker',
            headerShown: true,
            headerStyle: { backgroundColor: cores.primaria },
            headerTintColor: cores.branco,
            headerTitleStyle: { fontWeight: 'bold' }
          }}
        />
        <Stack.Screen
          name="HistoricoDeAtividades"
          component={HistoricoDeAtividades}
          options={({ navigation }) => ({
            headerShown: true,
            title: '', // Remove o título padrão
            headerStyle: { backgroundColor: cores.primaria },
            headerTintColor: cores.branco,
            headerTitleStyle: { fontWeight: 'bold' },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate('Principal')}
                style={{ marginLeft: 15, flexDirection: 'row', alignItems: 'center' }}
              >
                <Text style={{ color: cores.branco, fontSize: 16 }}>← Voltar</Text>
              </TouchableOpacity>
            ),
            headerRight: () => (
              <View style={{ marginRight: 15 }}>
                <Text style={{ 
                  color: cores.branco, 
                  fontSize: 18, 
                  fontWeight: 'bold' 
                }}>
                  Histórico de Atividades
                </Text>
              </View>
            ),
          })}
        />

        <Stack.Screen
          name="TelaFormularioDeAtividade"
          component={TelaFormularioDeAtividade}
          options={({ route }) => ({
            headerShown: true,
            title: route.params?.initialValues ? 'Editar Atividade' : 'Nova Atividade',
            headerStyle: { backgroundColor: cores.primaria },
            headerTintColor: cores.branco,
            headerTitleStyle: { fontWeight: 'bold' }
          })}
        />

        <Stack.Screen
          name="Estatisticas"
          component={Estatisticas}
          options={{
            headerShown: true,
            title: 'Estatísticas',
            headerStyle: { 
              backgroundColor: cores.primaria,
              paddingTop: 50
            },
            headerTintColor: cores.branco,
            headerTitleStyle: { fontWeight: 'bold' }
          }}
        />
        <Stack.Screen
          name="Configuracoes"
          component={Configuracoes}
          options={{
            headerShown: true,
            title: 'Configurações',
            headerStyle: { backgroundColor: cores.primaria },
            headerTintColor: cores.branco,
            headerTitleStyle: { fontWeight: 'bold' }
          }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}