// App.js
import './Credenciales'; // Asegura que Firebase se inicialice temprano
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';

import LoadingScreen from './screens/LoadingScreen';
import Home from './screens/Home';
import Login from './screens/Login';
import Register from './screens/Register';
import ProfileModalScreen from './screens/ProfileModalScreen';
import NewNotification from './screens/NewNotification';
import AlertDetailScreen from './screens/AlertDetailScreen';
import CategoryScreen from './screens/CategoryScreen';
import MapScreen from './screens/MapScreen';
import PanicAlertDetailScreen from './screens/PanicAlertDetailScreen';
import AllPanicAlertsScreen from './screens/AllPanicAlertsScreen';
import NewsScreen from './screens/NewsScreen';
import NewsDetailsScreen from './screens/NewsDetailsScreen';
import AddNews from './screens/AddNews';

import { AuthProvider } from './context/AuthContext';
import colors from './constants/colors';

export default function App() {
  const Stack = createStackNavigator();

  function MyStack() {
    return (
      <Stack.Navigator>
        <Stack.Screen name="Loading" component={LoadingScreen} options={{ headerShown: false }} />

        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />

        <Stack.Screen
          name="Register"
          component={Register}
          options={{
            title: 'Crear cuenta',
            headerTintColor: 'white',
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: '#007AFF' },
            headerBackTitle: 'Iniciar sesion',
          }}
        />

        <Stack.Screen
          name="Home"
          component={Home}
          options={({ navigation }) => ({
            title: 'Principal',
            headerLeft: () => null,
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: '#007AFF' },
            headerTintColor: '#fff',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate('ProfileModal')}
                style={{ marginRight: 15 }}
              >
                <Ionicons name="person-circle-outline" size={30} color="#fff" />
              </TouchableOpacity>
            ),
          })}
        />

        <Stack.Screen
          name="NewsScreen"
          component={NewsScreen}
          options={({ navigation }) => ({
            title: 'Noticias locales',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
            headerTitleAlign: 'center',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate('AddNews')}
                style={{ marginRight: 15 }}
              >
                <Ionicons name="add-circle-outline" size={28} color="#fff" />
              </TouchableOpacity>
            ),
          })}
        />

        <Stack.Screen
          name="NewsDetailsScreen"
          component={NewsDetailsScreen}
          options={{
            title: 'Noticia',
            headerStyle: {
              backgroundColor: colors.primary,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: '#fff',
            headerTitleAlign: 'center',
            headerBackTitleVisible: false,
            headerTransparent: true,
            headerBlurEffect: 'dark',
          }}
        />

        <Stack.Screen
          name="MapScreen"
          component={MapScreen}
          options={{ title: 'Ubicación de la Alerta' }}
        />
        <Stack.Screen name="CategoryScreen" component={CategoryScreen} />
        <Stack.Screen
          name="NuevaNotificacion"
          component={NewNotification}
          options={{
            title: 'Crear notificación',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
          }}
        />

        <Stack.Screen
          name="AddNews"
          component={AddNews}
          options={({ route }) => ({
            title: route.params?.news ? 'Editar noticia' : 'Agregar noticia',
          })}
        />

        <Stack.Screen
          name="AlertDetailScreen"
          component={AlertDetailScreen}
          options={{
            title: 'Detalle de alerta',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="PanicAlertDetailScreen"
          component={PanicAlertDetailScreen}
          options={{
            title: 'Detalle de alerta',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
            headerTitleAlign: 'center',
            headerBackTitle: 'Volver',
          }}
        />
        <Stack.Screen
          name="AllPanicAlertsScreen"
          component={AllPanicAlertsScreen}
          options={({ route }) => ({
            title: route.params?.category || 'Alertas de pánico',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
            headerTitleAlign: 'center',
          })}
        />

        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen
            name="ProfileModal"
            component={ProfileModalScreen}
            options={{ headerShown: false }}
          />
        </Stack.Group>
      </Stack.Navigator>
    );
  }

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider>
          <NavigationContainer>
            <MyStack />
            <StatusBar style="light" />
          </NavigationContainer>
        </PaperProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
