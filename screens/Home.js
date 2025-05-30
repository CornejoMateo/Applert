import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AlertsScreen from './AlertasScreen';
import NewsScreen from './NewsScreen';

const Home = () => {
  const [activeTab, setActiveTab] = useState('alertas');

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => setActiveTab('alertas')}>
          <Text style={[styles.tabText, activeTab === 'alertas' && styles.activeTabText]}>
            Alertas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab('noticias')}>
          <Text style={[styles.tabText, activeTab === 'noticias' && styles.activeTabText]}>
            Noticias
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'alertas' ? <AlertsScreen /> : <NewsScreen />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    justifyContent: 'space-around',
    elevation: 4,
  },
  tabText: {
    color: '#555',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
});

export default Home;
