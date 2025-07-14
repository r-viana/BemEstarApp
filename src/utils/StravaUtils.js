import { ACTIVITY_TYPE_MAPPING } from '../services/StravaConfig';
import { getUserId } from '../services/FirebaseConfig';

/**
 * Utilitários para conversão de dados do Strava
 */

/**
 * Converter atividade do Strava para formato do app
 */
export const convertStravaActivity = (stravaActivity) => {
  try {
    // Mapear tipo de atividade
    const mappedType = ACTIVITY_TYPE_MAPPING[stravaActivity.type] || ACTIVITY_TYPE_MAPPING.DEFAULT;
    
    // Converter data
    const activityDate = new Date(stravaActivity.start_date_local || stravaActivity.start_date);
    
    // Converter duração de segundos para minutos
    const durationMinutes = Math.round((stravaActivity.moving_time || stravaActivity.elapsed_time) / 60);
    
    // Converter distância de metros para quilômetros
    const distanceKm = stravaActivity.distance ? Math.round((stravaActivity.distance / 1000) * 100) / 100 : 0;
    
    // Determinar se é ao ar livre
    const isOutdoor = determineIfOutdoor(stravaActivity);
    
    // Gerar local baseado nos dados disponíveis
    const location = generateLocation(stravaActivity);
    
    // Gerar notas
    const notes = generateNotes(stravaActivity);

    // Retornar no formato do app
    return {
      type: mappedType,
      date: activityDate,
      durationMinutes: durationMinutes,
      locationName: location,
      isOutdoor: isOutdoor,
      distanceKm: distanceKm,
      notes: notes,
      // Metadados do Strava
      origem: 'strava',
      stravaId: stravaActivity.id.toString(),
      stravaType: stravaActivity.type,
      stravaName: stravaActivity.name,
      // Dados adicionais úteis
      stravaAverageSpeed: stravaActivity.average_speed,
      stravaMaxSpeed: stravaActivity.max_speed,
      stravaElevationGain: stravaActivity.total_elevation_gain,
      stravaAverageHeartrate: stravaActivity.average_heartrate,
      stravaMaxHeartrate: stravaActivity.max_heartrate,
      stravaCadence: stravaActivity.average_cadence,
      stravaWatts: stravaActivity.average_watts,
      stravaCalories: stravaActivity.kilojoules ? Math.round(stravaActivity.kilojoules * 0.239) : null,
      // Dados de localização
      stravaStartLatlng: stravaActivity.start_latlng,
      stravaEndLatlng: stravaActivity.end_latlng,
      stravaLocationCity: stravaActivity.location_city,
      stravaLocationState: stravaActivity.location_state,
      stravaLocationCountry: stravaActivity.location_country
    };
    
  } catch (error) {
    console.log('Erro ao converter atividade Strava:', error);
    throw new Error(`Erro ao converter atividade ${stravaActivity.id}: ${error.message}`);
  }
};

/**
 * Determinar se atividade é ao ar livre
 */
const determineIfOutdoor = (stravaActivity) => {
  // Tipos que são tipicamente indoor
  const indoorTypes = [
    'WeightTraining', 
    'Workout', 
    'Crossfit', 
    'Yoga', 
    'Pilates',
    'VirtualRide',
    'VirtualRun'
  ];
  
  // Verificar tipo da atividade
  if (indoorTypes.includes(stravaActivity.type)) {
    return false;
  }
  
  // Verificar se tem coordenadas GPS (indica outdoor)
  if (stravaActivity.start_latlng && stravaActivity.start_latlng.length > 0) {
    return true;
  }
  
  // Verificar flags específicas do Strava
  if (stravaActivity.trainer === true || stravaActivity.indoor === true) {
    return false;
  }
  
  // Default: considerar outdoor para atividades de movimento
  const outdoorTypes = ['Run', 'Ride', 'Walk', 'Hike', 'Swim'];
  return outdoorTypes.includes(stravaActivity.type);
};

/**
 * Gerar descrição do local baseado nos dados do Strava
 */
const generateLocation = (stravaActivity) => {
  // Prioridade: cidade > estado > país > coordenadas > nome da atividade > fallback
  
  if (stravaActivity.location_city) {
    let location = stravaActivity.location_city;
    
    if (stravaActivity.location_state) {
      location += `, ${stravaActivity.location_state}`;
    }
    
    return location;
  }
  
  if (stravaActivity.location_state) {
    let location = stravaActivity.location_state;
    
    if (stravaActivity.location_country) {
      location += `, ${stravaActivity.location_country}`;
    }
    
    return location;
  }
  
  if (stravaActivity.location_country) {
    return stravaActivity.location_country;
  }
  
  // Se tem coordenadas, gerar descrição baseada nelas
  if (stravaActivity.start_latlng && stravaActivity.start_latlng.length > 0) {
    const [lat, lng] = stravaActivity.start_latlng;
    return `Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
  
  // Tentar extrair local do nome da atividade
  const activityName = stravaActivity.name || '';
  const locationWords = ['em', 'no', 'na', 'at', 'in', 'on'];
  
  for (const word of locationWords) {
    const index = activityName.toLowerCase().indexOf(word + ' ');
    if (index !== -1) {
      const possibleLocation = activityName.substring(index + word.length + 1).trim();
      if (possibleLocation.length > 2 && possibleLocation.length < 50) {
        return possibleLocation;
      }
    }
  }
  
  // Fallback
  return 'Importado do Strava';
};

/**
 * Gerar notas baseado nos dados do Strava
 */
const generateNotes = (stravaActivity) => {
  const notes = [];
  
  // Adicionar nome da atividade se não for genérico
  const name = stravaActivity.name || '';
  const genericNames = [
    'Morning Run', 'Afternoon Run', 'Evening Run',
    'Morning Ride', 'Afternoon Ride', 'Evening Ride',
    'Lunch Run', 'Quick Run', 'Easy Run'
  ];
  
  if (name && !genericNames.includes(name) && name.length > 3) {
    notes.push(`"${name}"`);
  }
  
  // Adicionar descrição se existir
  if (stravaActivity.description && stravaActivity.description.trim()) {
    notes.push(stravaActivity.description.trim());
  }
  
  // Adicionar dados de performance interessantes
  const performanceNotes = [];
  
  if (stravaActivity.average_heartrate) {
    performanceNotes.push(`FC média: ${Math.round(stravaActivity.average_heartrate)} bpm`);
  }
  
  if (stravaActivity.max_heartrate) {
    performanceNotes.push(`FC máx: ${Math.round(stravaActivity.max_heartrate)} bpm`);
  }
  
  if (stravaActivity.average_speed && stravaActivity.distance > 0) {
    const speedKmh = stravaActivity.average_speed * 3.6; // m/s para km/h
    performanceNotes.push(`Velocidade média: ${speedKmh.toFixed(1)} km/h`);
  }
  
  if (stravaActivity.total_elevation_gain > 0) {
    performanceNotes.push(`Elevação: ${Math.round(stravaActivity.total_elevation_gain)}m`);
  }
  
  if (stravaActivity.average_watts) {
    performanceNotes.push(`Potência média: ${Math.round(stravaActivity.average_watts)}W`);
  }
  
  if (performanceNotes.length > 0) {
    notes.push(`Dados: ${performanceNotes.join(' • ')}`);
  }
  
  // Adicionar nota de origem
  notes.push('📱 Importado do Strava');
  
  return notes.join('\n\n');
};

/**
 * Formatar dados do atleta Strava
 */
export const formatStravaAthlete = (athlete) => {
  return {
    id: athlete.id,
    name: `${athlete.firstname} ${athlete.lastname}`.trim(),
    firstName: athlete.firstname,
    lastName: athlete.lastname,
    city: athlete.city,
    state: athlete.state,
    country: athlete.country,
    sex: athlete.sex,
    premium: athlete.premium,
    createdAt: athlete.created_at,
    updatedAt: athlete.updated_at,
    followerCount: athlete.follower_count,
    friendCount: athlete.friend_count,
    profilePicture: athlete.profile_medium || athlete.profile,
    measurementPreference: athlete.measurement_preference, // feet ou meters
    ftp: athlete.ftp // Functional Threshold Power
  };
};

/**
 * Validar dados de atividade do Strava
 */
export const validateStravaActivity = (stravaActivity) => {
  const errors = [];
  
  if (!stravaActivity.id) {
    errors.push('ID da atividade não encontrado');
  }
  
  if (!stravaActivity.type) {
    errors.push('Tipo da atividade não encontrado');
  }
  
  if (!stravaActivity.start_date && !stravaActivity.start_date_local) {
    errors.push('Data da atividade não encontrada');
  }
  
  if (!stravaActivity.moving_time && !stravaActivity.elapsed_time) {
    errors.push('Duração da atividade não encontrada');
  }
  
  if (stravaActivity.moving_time && stravaActivity.moving_time < 60) {
    errors.push('Atividade muito curta (menos de 1 minuto)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Obter ícone para tipo de atividade Strava
 */
export const getStravaActivityIcon = (stravaType) => {
  const iconMap = {
    'Run': '🏃‍♂️',
    'Walk': '🚶‍♂️',
    'Hike': '🥾',
    'Ride': '🚴‍♂️',
    'VirtualRide': '🚴‍♂️',
    'Swim': '🏊‍♂️',
    'WeightTraining': '🏋️‍♂️',
    'Workout': '💪',
    'Crossfit': '🤾‍♂️',
    'Yoga': '🧘',
    'Pilates': '🤸‍♀️',
    'Dance': '💃',
    'Stretching': '🤸‍♂️',
    'Meditation': '🧘‍♂️'
  };
  
  return iconMap[stravaType] || '⚡';
};

/**
 * Converter velocidade do Strava (m/s) para pace (min/km)
 */
export const convertSpeedToPace = (speedMs) => {
  if (!speedMs || speedMs <= 0) return null;
  
  const paceSeconds = 1000 / speedMs; // segundos por quilômetro
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
};

/**
 * Formatar duração em segundos para formato legível
 */
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else if (minutes > 0) {
    return `${minutes}min ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};