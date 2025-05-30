import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { formatTimestamp } from '../utils/formatTimestamp';
import ImageViewing from 'react-native-image-viewing';
import { softDeleteNews, getNewsById } from '../services/firebaseService';
import responderRoles from '../constants/responderRoles';

const screenHeight = Dimensions.get('window').height;

const ENTITY_STYLES = {
  Policia: { color: '#1E88E5', icon: 'shield-outline', label: 'Policía' },
  Bomberos: { color: '#E53935', icon: 'flame-outline', label: 'Bomberos' },
  DefensaCivil: { color: '#FF9800', icon: 'alert-circle-outline', label: 'Defensa Civil' },
  Municipalidad: { color: '#888', icon: 'business-outline', label: 'Municipalidad' },
  Ciudadano: { color: '#888', icon: 'person-outline', label: 'Ciudadano' },
};

const NewsDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { news: newsFromParams, role, onGoBack, username } = route.params;
  const [currentNews, setCurrentNews] = useState(newsFromParams);
  const [isImageViewVisible, setImageViewVisible] = useState(false);
  const isResponder = responderRoles.includes(username);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAndUpdateNewsDetails = useCallback(async () => {
    if (!newsFromParams || !newsFromParams.id) {
      console.warn('fetchAndUpdateNewsDetails: ID de noticia no encontrado en parámetros.');

      return;
    }
    try {
      const updatedNews = await getNewsById(newsFromParams.id);
      if (updatedNews) {
        setCurrentNews(updatedNews);
      } else {
        Alert.alert('Error', 'No se pudo encontrar la noticia. Puede que haya sido eliminada.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Error al actualizar la noticia:', error);
    }
  }, [newsFromParams?.id, navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchAndUpdateNewsDetails();
    }, [fetchAndUpdateNewsDetails])
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAndUpdateNewsDetails();
    setIsRefreshing(false);
  }, [fetchAndUpdateNewsDetails]);

  const handleShare = async () => {
    if (!currentNews) return;
    try {
      await Share.share({
        message: `${currentNews.title}\n\n${currentNews.content}\n\nCompartido desde Applert`,
        title: currentNews.title,
      });
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  };

  const handleEdit = () => {
    if (!currentNews) return;
    navigation.navigate('AddNews', {
      news: currentNews,
      username: role,
      onGoBack: () => {
        if (onGoBack) onGoBack();
      },
    });
  };

  const handleDelete = () => {
    if (!currentNews || !currentNews.id) return;
    Alert.alert('Confirmar eliminación', '¿Estás seguro de que deseas eliminar esta noticia?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => confirmDelete(currentNews.id) },
    ]);
  };

  const confirmDelete = async (id) => {
    try {
      await softDeleteNews(id);
      Alert.alert('Éxito', 'La noticia fue eliminada.');
      if (onGoBack) onGoBack();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la noticia.');
      console.error('Error eliminando noticia:', error);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleShare]);

  const { date, time } = currentNews?.createdAt
    ? formatTimestamp(currentNews.createdAt)
    : { date: '', time: '' };

  if (!currentNews) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Cargando detalles de la noticia...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#6d91bb']}
          tintColor="#6d91bb"
        />
      }
    >
      <View style={styles.imageContainer}>
        {currentNews.imageUrl && (
          <TouchableOpacity onPress={() => setImageViewVisible(true)} activeOpacity={0.8}>
            <ExpoImage
              source={{ uri: currentNews.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          </TouchableOpacity>
        )}
        {currentNews.imageUrl && (
          <ImageViewing
            images={[{ uri: currentNews.imageUrl }]}
            imageIndex={0}
            visible={isImageViewVisible}
            onRequestClose={() => setImageViewVisible(false)}
            swipeToCloseEnabled={true}
            doubleTapToZoomEnabled={true}
            backgroundColor="#000"
          />
        )}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.metaContainer}>
          <View style={[styles.metaItem, { flex: 1 }]}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.metaText}>
              {date} {time}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View
              style={[styles.entityTag, { backgroundColor: ENTITY_STYLES[role]?.color || '#888' }]}
            >
              <Ionicons
                name={ENTITY_STYLES[role]?.icon || 'person-outline'}
                size={14}
                color="#fff"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.entityTagText}> {ENTITY_STYLES[role]?.label || role}</Text>
            </View>
          </View>
        </View>
        <View style={styles.header}>
          <Text style={styles.title}>{currentNews.title}</Text>
          <View style={styles.mainContent}>
            <Text style={styles.contentDescription}>Descripción:</Text>
            <Text style={styles.content}>{currentNews.content}</Text>
          </View>
        </View>

        {isResponder && username == role && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={[styles.actionButton]} onPress={handleEdit}>
              <Ionicons name="pencil-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Editar noticia</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Eliminar noticia</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Applert - Noticias locales</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    width: '98%',
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    position: 'relative',
    marginTop: screenHeight * 0.12, // 10% del alto real de la pantalla
  },
  image: {
    width: '100%',
    height: undefined,
    aspectRatio: 16 / 9,
    backgroundColor: '#f0f0f0',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6d91bb',
    lineHeight: 34,
    marginBottom: 16,
    marginTop: 16,
    letterSpacing: -0.5,
    textAlign: 'justify',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  mainContent: {
    marginBottom: 20,
  },
  contentDescription: {
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
    marginBottom: 4,
  },
  content: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
    textAlign: 'justify',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 20,
    marginTop: '5%',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    position: 'absolute',
    top: 10,
    width: '100%',
  },
  shareButton: {
    marginRight: 15,
    padding: 4,
  },
  entityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 8,
  },
  entityTagText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    gap: 20,
    top: '0%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#d3d3d3',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
});

export default NewsDetailsScreen;
