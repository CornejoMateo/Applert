import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getNews } from '../services/firebaseService';
import { formatTimestamp } from '../utils/formatTimestamp';
import responderRoles from '../constants/responderRoles';
import { softDeleteNews } from '../services/firebaseService';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { Animated } from 'react-native';
import { LayoutAnimation, UIManager, Platform } from 'react-native';
import { Menu } from 'react-native-paper';

const NewsScreen = ({}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { username } = route.params;
  const isFocused = useIsFocused();
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const isResponder = username && responderRoles.includes(username);
  const [visibleMenuId, setVisibleMenuId] = useState(null);
  const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
  const [deletedItemId, setDeletedItemId] = useState(null);
  const animationRefs = useRef({});
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const openMenu = (id) => {
    setVisibleMenuId(id);
  };

  const closeMenu = () => {
    setVisibleMenuId(null);
  };

  const fetchNews = async () => {
    setLoading(true);
    try {
      const data = await getNews();
      setNewsList(data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [isFocused]);

  const handleNewsPress = (newsItem) => {
    navigation.navigate('NewsDetailsScreen', {
      news: newsItem,
      role: newsItem.role,
      username: username,
    });
  };

  const renderItem = ({ item }) => {
    const animation = new Animated.Value(1);
    const { date, time } = formatTimestamp(item.createdAt);

    const animateDeletion = () => {
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        confirmDelete(item.id);
      });
    };

    const handleDelete = (id) => {
      Alert.alert('Confirmar eliminación', '¿Estás seguro de que deseas eliminar esta noticia?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: animateDeletion },
      ]);
    };

    const confirmDelete = async (id) => {
      try {
        await softDeleteNews(id);
        setNewsList((prevNews) => prevNews.filter((news) => news.id !== id));

        setMessage('Noticia eliminada con éxito');
        setMessageType('success');
      } catch (error) {
        console.error('Error eliminando noticia:', error);
        setMessage('Error al eliminar la noticia');
        setMessageType('error');
      }

      setTimeout(() => {
        setMessage(null);
        setMessageType(null);
      }, 3000);
    };

    const handleEdit = () => {
      navigation.navigate('AddNews', { news: item, username: username, newsId: item.id });
      closeMenu();
    };

    return (
      <Animated.View
        style={{
          opacity: animation,
          transform: [{ scale: animation }],
        }}
      >
        <TouchableOpacity
          style={styles.cardContainer}
          onPress={() => handleNewsPress(item)}
          activeOpacity={0.9}
        >
          <View style={styles.card}>
            {item.imageUrl && (
              <View style={styles.imageContainer}>
                <ExpoImage
                  source={{ uri: item.imageUrl }}
                  style={styles.image}
                  contentFit="cover"
                  transition={200}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.imageGradient}
                />
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.description} numberOfLines={3}>
                {item.content}
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.dateContainer}>
                  <Ionicons name="time-outline" size={14} color="#888" />
                  <Text style={styles.date}>
                    {date} {time}
                  </Text>
                </View>

                {isResponder && item.role == username && (
                  <Menu
                    visible={visibleMenuId === item.id}
                    onDismiss={closeMenu}
                    anchor={
                      <TouchableOpacity onPress={() => openMenu(item.id)} style={styles.menuButton}>
                        <Ionicons name="ellipsis-vertical" size={20} color="#6d91bb" />
                      </TouchableOpacity>
                    }
                  >
                    <Menu.Item onPress={handleEdit} title="Editar noticia" leadingIcon="pencil" />
                    <Menu.Item
                      onPress={() => handleDelete(item.id)}
                      title="Eliminar noticia"
                      leadingIcon="delete"
                    />
                  </Menu>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6d91bb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Noticias locales</Text>
        {isResponder && (
          <TouchableOpacity onPress={() => navigation.navigate('AddNews', { username: username })}>
            <Ionicons name="add-circle-outline" size={30} color="#007bff" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={newsList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              setLoading(true);
              fetchNews();
            }}
            colors={['#6d91bb']}
            tintColor="#6d91bb"
          />
        }
      />
      {message && (
        <View
          style={[styles.messageBox, messageType === 'success' ? styles.success : styles.error]}
        >
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  cardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  imageContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6d91bb',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  menuButton: {
    padding: 4,
  },
  messageBox: {
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    alignItems: 'center',
  },
  success: {
    backgroundColor: '#d4edda',
  },
  error: {
    backgroundColor: '#f8d7da',
  },
  messageText: {
    color: '#155724',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E88E5',
  },
});

export default NewsScreen;
