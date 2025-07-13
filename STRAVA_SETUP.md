# 🔗 Configuração da Integração com Strava

Este documento explica como configurar a integração com a API do Strava no BemEstarApp.

## 📋 Pré-requisitos

1. Conta no Strava (gratuita)
2. Acesso ao [Strava Developers](https://developers.strava.com/)

## 🚀 Passo a Passo

### 1. Criar Aplicação no Strava

1. Acesse [https://developers.strava.com/](https://developers.strava.com/)
2. Faça login com sua conta do Strava
3. Clique em **"Create & Manage Your App"**
4. Preencha os dados:
   - **Application Name**: `BemEstarApp`
   - **Category**: `Fitness`
   - **Website**: `https://bemestarapp.com` (ou seu site)
   - **Authorization Callback Domain**: `com.bemestarapp`
5. Clique em **"Create"**

### 2. Obter Credenciais

Após criar a aplicação, você verá:
- **Client ID**: Copie este valor
- **Client Secret**: Copie este valor

### 3. Configurar Callback Domain

1. Na página da sua aplicação, vá em **"Settings"**
2. Em **"Authorization Callback Domain"**, adicione: `com.bemestarapp`
3. Salve as alterações

### 4. Atualizar Configuração no App

1. Abra o arquivo `src/config/StravaConfig.js`
2. Substitua os valores:

```javascript
export const STRAVA_CONFIG = {
  CLIENT_ID: 'SEU_CLIENT_ID_AQUI',
  CLIENT_SECRET: 'SEU_CLIENT_SECRET_AQUI',
  REDIRECT_URI: 'com.bemestarapp://strava-callback',
  // ... resto da configuração
};
```

### 5. Testar a Integração

1. Execute o app: `npm start`
2. Navegue até **"Conectar Strava"**
3. Clique em **"Conectar com Strava"**
4. Autorize o app no Strava
5. Teste a sincronização de atividades

## 🔧 Funcionalidades Implementadas

### ✅ O que já funciona:

- **Autenticação OAuth** com Strava
- **Renovação automática** de tokens
- **Sincronização de atividades** do Strava
- **Conversão de tipos** de atividade
- **Armazenamento local** de tokens
- **Deep linking** para callback
- **Interface de usuário** para conexão

### 📊 Dados Sincronizados:

- **Atividades**: Corrida, caminhada, ciclismo, natação, etc.
- **Metadados**: Distância, duração, local, data/hora
- **Dados do atleta**: Nome, cidade, país
- **Estatísticas**: Tempo total, distância total

### 🗺️ Mapeamento de Tipos:

| Strava | BemEstarApp |
|--------|-------------|
| Run | Caminhada & Corrida |
| Walk | Caminhada & Corrida |
| Ride | Ciclismo |
| Swim | Natação |
| WeightTraining | Musculação |
| Yoga | Yoga |
| Pilates | Pilates |
| Dance | Dança |
| Crossfit | Funcional |
| Stretching | Alongamento |
| Meditation | Meditação |
| Workout | Funcional |

## 🛠️ Estrutura de Arquivos

```
src/
├── services/
│   ├── StravaService.js          # Serviço principal do Strava
│   └── AtividadeService.js       # Integração com atividades
├── config/
│   └── StravaConfig.js           # Configurações
├── utils/
│   └── StravaCallbackHandler.js  # Handler de callback
└── views/screens/
    └── ConectarStrava.js         # Tela de conexão
```

## 🔒 Segurança

- Tokens são armazenados localmente com AsyncStorage
- Renovação automática de tokens expirados
- Validação de permissões antes das requisições
- Tratamento de erros robusto

## 🐛 Solução de Problemas

### Erro: "Token do Strava não válido"
- Verifique se as credenciais estão corretas
- Tente desconectar e reconectar

### Erro: "Não foi possível conectar com o Strava"
- Verifique a conexão com a internet
- Confirme se o callback domain está configurado

### Erro: "Código de autorização não encontrado"
- Verifique se o deep linking está funcionando
- Confirme se o scheme está configurado no app.json

## 📱 Testando no Dispositivo

1. **Android**: Use `expo start --android`
2. **iOS**: Use `expo start --ios`
3. **Web**: Use `expo start --web`

## 🔄 Próximos Passos

- [ ] Sincronização automática em background
- [ ] Notificações de novas atividades
- [ ] Sincronização bidirecional
- [ ] Suporte a mais tipos de atividade
- [ ] Estatísticas avançadas do Strava

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no console
2. Confirme se as credenciais estão corretas
3. Teste a conexão com a API do Strava
4. Verifique se o deep linking está funcionando

---

**Nota**: Mantenha suas credenciais seguras e não as compartilhe publicamente. 