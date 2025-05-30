import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRoute } from '@react-navigation/native';
import colors from '../constants/colors';

const MapScreen = () => {
  const route = useRoute();

  const {
    latitude,
    longitude,
    title = 'Ubicación de Alerta',
    userName = 'Usuario Desconocido',
    timestamp,
    email,
  } = route.params || {};

  const hasValidCoordinates = typeof latitude === 'number' && typeof longitude === 'number';

  if (!hasValidCoordinates) {
    console.error('MapScreen: No se recibieron coordenadas válidas.', route.params);
    Alert.alert(
      'Error',
      'No se pudo cargar la ubicación de la alerta porque faltan las coordenadas.'
    );
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: Coordenadas no válidas.</Text>
        <Text style={styles.errorDetails}>No se puede mostrar el mapa.</Text>
      </View>
    );
  }

  const initialRegion = {
    latitude: latitude,
    longitude: longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const formattedTimestamp = timestamp
    ? new Date(timestamp).toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'medium',
      })
    : 'Hora desconocida';

  const markerDescription = `Usuario: ${userName}\nEmail: ${email || 'N/A'}\nHora: ${formattedTimestamp}`;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={title}
          description={markerDescription}
          pinColor={colors.fireDepartment || 'red'}
        />
      </MapView>

      <View style={styles.infoOverlay}>
        <Text style={styles.infoText}>Alerta de: {userName}</Text>
        <Text style={styles.infoText}>Hora: {formattedTimestamp}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background || '#F7F8FA',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.fireDepartment || 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorDetails: {
    fontSize: 14,
    color: colors.textSecondary || '#666',
    textAlign: 'center',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  infoText: {
    fontSize: 14,
    color: colors.textPrimary || '#333',
    marginBottom: 4,
  },
});

export default MapScreen;
