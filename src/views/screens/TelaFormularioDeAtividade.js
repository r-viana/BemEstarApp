    // src/views/screens/TelaFormularioDeAtividade.js
    import React from 'react';
    import { View, StyleSheet, Alert } from 'react-native';
    import { useNavigation, useRoute } from '@react-navigation/native';
    import FormularioDeAtividade from '../../components/FormularioDeAtividade'; // Ajuste o caminho se necessário
    import { cores } from '../../utils/Cores';

    const TelaFormularioDeAtividade = () => { // Renomeado para seguir o nome do arquivo
      const navigation = useNavigation();
      const route = useRoute();

      const { initialValues } = route.params || {};

      const handleSaveActivity = (activityData) => {
        if (initialValues && initialValues.id) {
          Alert.alert('Atividade Atualizada', JSON.stringify({ id: initialValues.id, ...activityData }, null, 2));
          console.log('Dados da atividade para atualizar:', { id: initialValues.id, ...activityData });
        } else {
          Alert.alert('Nova Atividade Salva', JSON.stringify(activityData, null, 2));
          console.log('Dados da nova atividade para salvar:', activityData);
        }
        navigation.goBack();
      };

      const handleCancel = () => {
        navigation.goBack();
      };

      return (
        <View style={styles.container}>
          <FormularioDeAtividade
            onSave={handleSaveActivity}
            onCancel={handleCancel}
            initialValues={initialValues}
          />
        </View>
      );
    };

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: cores.fundo, // Usando a cor de fundo do seu tema
      },
    });

    export default TelaFormularioDeAtividade; // Exporte com o nome atualizado
