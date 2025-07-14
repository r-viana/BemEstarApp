const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Configurações do Strava
const STRAVA_CLIENT_ID = '167642';
const STRAVA_CLIENT_SECRET = 'c8b35e9ac400fe020dcb4aa4764f40e461848224';

// Function para callback do Strava
exports.stravaCallback = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { code, state } = req.query;
      
      if (!code) {
        return res.status(400).send('Código de autorização não encontrado');
      }

      console.log('Código recebido do Strava:', code);
      console.log('State (userId):', state);

      // Trocar código por token
      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code'
        })
      });

      if (!tokenResponse.ok) {
        throw new Error(`Erro na resposta do Strava: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('Token obtido do Strava');

      // Salvar no Firestore se userId foi fornecido
      if (state) {
        const db = admin.firestore();
        await db.collection('users').doc(state).update({
          stravaAccessToken: tokenData.access_token,
          stravaRefreshToken: tokenData.refresh_token,
          stravaAthleteId: tokenData.athlete.id,
          stravaAthleteData: tokenData.athlete,
          stravaConnectedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Dados salvos no Firestore para usuário:', state);
      }

      // Redirecionar de volta para o app com sucesso
      const successHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Conectado com Sucesso!</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: #f5f5f5; 
            }
            .container { 
              background: white; 
              padding: 30px; 
              border-radius: 10px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
              max-width: 400px; 
              margin: 0 auto; 
            }
            .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
            .athlete { color: #333; margin: 20px 0; }
            .close-btn { 
              background: #FC4C02; 
              color: white; 
              border: none; 
              padding: 15px 30px; 
              border-radius: 5px; 
              font-size: 16px; 
              cursor: pointer; 
              margin-top: 20px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✅ Conectado com Sucesso!</div>
            <div class="athlete">
              <strong>${tokenData.athlete.firstname} ${tokenData.athlete.lastname}</strong><br>
              ${tokenData.athlete.city}, ${tokenData.athlete.country}
            </div>
            <p>Sua conta do Strava foi conectada com sucesso!</p>
            <button class="close-btn" onclick="closeWindow()">Fechar e Voltar ao App</button>
          </div>
          
          <script>
            function closeWindow() {
              // Tentar fechar a aba/janela
              if (window.opener) {
                window.close();
              } else {
                // Se não conseguir fechar, mostrar mensagem
                document.body.innerHTML = '<div class="container"><h2>Pode fechar esta aba e voltar ao app</h2></div>';
              }
            }
            
            // Auto-fechar após 5 segundos
            setTimeout(() => {
              closeWindow();
            }, 5000);
          </script>
        </body>
        </html>
      `;

      res.send(successHtml);

    } catch (error) {
      console.error('Erro no callback do Strava:', error);
      
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erro na Conexão</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: #f5f5f5; 
            }
            .container { 
              background: white; 
              padding: 30px; 
              border-radius: 10px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
              max-width: 400px; 
              margin: 0 auto; 
            }
            .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">❌ Erro na Conexão</div>
            <p>Não foi possível conectar com o Strava. Tente novamente.</p>
            <button onclick="window.close()">Fechar</button>
          </div>
        </body>
        </html>
      `;
      
      res.status(500).send(errorHtml);
    }
  });
});

// Function para sincronizar atividades do Strava
exports.syncStravaActivities = functions.https.onCall(async (data, context) => {
  try {
    // Verificar se usuário está autenticado
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
    }

    const userId = context.auth.uid;
    const db = admin.firestore();
    
    // Buscar token do Strava do usuário
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Usuário não encontrado');
    }

    const userData = userDoc.data();
    const accessToken = userData.stravaAccessToken;
    
    if (!accessToken) {
      throw new functions.https.HttpsError('failed-precondition', 'Strava não conectado');
    }

    console.log('Sincronizando atividades para usuário:', userId);

    // Buscar atividades do Strava
    const activitiesResponse = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=50', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!activitiesResponse.ok) {
      throw new functions.https.HttpsError('external', 'Erro ao buscar atividades do Strava');
    }

    const activities = await activitiesResponse.json();
    console.log(`Encontradas ${activities.length} atividades no Strava`);

    // Converter e salvar atividades
    const batch = db.batch();
    let syncedCount = 0;

    for (const activity of activities) {
      // Mapeamento de tipos do Strava para tipos do app
      const typeMapping = {
        'Run': 'Caminhada & Corrida',
        'Walk': 'Caminhada & Corrida',
        'Ride': 'Ciclismo',
        'Swim': 'Natação',
        'WeightTraining': 'Musculação',
        'Yoga': 'Yoga',
        'Pilates': 'Pilates',
        'Dance': 'Dança',
        'Crossfit': 'Funcional',
        'Stretching': 'Alongamento',
        'Meditation': 'Meditação',
        'Workout': 'Funcional'
      };

      const mappedType = typeMapping[activity.type] || 'Funcional';
      
      // Converter atividade para formato do app
      const convertedActivity = {
        id: `strava_${activity.id}`,
        tipo: mappedType,
        data: admin.firestore.Timestamp.fromDate(new Date(activity.start_date)),
        duracaoMinutos: Math.round(activity.moving_time / 60),
        local: activity.location_city || activity.location_state || 'Strava',
        isOutdoor: !['WeightTraining', 'Yoga', 'Pilates'].includes(activity.type),
        distanciaKm: activity.distance ? Math.round(activity.distance / 1000 * 100) / 100 : 0,
        calorias: Math.round(activity.kilojoules * 0.239) || 0,
        fonte: 'strava',
        stravaId: activity.id,
        stravaData: activity,
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
        usuarioId: userId
      };

      // Verificar se atividade já existe
      const activityRef = db.collection('atividades').doc(convertedActivity.id);
      const existingActivity = await activityRef.get();
      
      if (!existingActivity.exists) {
        batch.set(activityRef, convertedActivity);
        syncedCount++;
      }
    }

    // Executar batch
    await batch.commit();
    
    // Atualizar timestamp de última sincronização
    await db.collection('users').doc(userId).update({
      stravaLastSync: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Sincronizadas ${syncedCount} novas atividades`);

    return {
      success: true,
      syncedActivities: syncedCount,
      totalActivities: activities.length,
      message: `${syncedCount} novas atividades sincronizadas`
    };

  } catch (error) {
    console.error('Erro ao sincronizar atividades:', error);
    throw new functions.https.HttpsError('internal', 'Erro ao sincronizar atividades');
  }
});