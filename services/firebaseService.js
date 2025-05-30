import appFireBase from '../Credenciales';
import {
  doc,
  updateDoc,
  getFirestore,
  collection,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';

const db = getFirestore(appFireBase);

export const getNotifications = async (username, category) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    let q = null;
    if (category == null) {
      if (username == 'Policia' || username == 'Bomberos' || username == 'DefensaCivil') {
        q = query(
          notificationsRef,
          where('category', '==', username),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          notificationsRef,
          where('userName', '==', username),
          orderBy('createdAt', 'desc')
        );
      }
    } else {
      q = query(
        notificationsRef,
        where('category', '==', category),
        where('userName', '==', username),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);

    const notifications = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return notifications;
  } catch (error) {
    console.error('Error al obtener notificaciones', error);
    return [];
  }
};

export const getPanicAlerts = async (username) => {
  try {
    const alertsRef = collection(db, 'panicAlerts');
    let q = null;
    if (username == 'Policia' || username == 'Bomberos' || username == 'DefensaCivil') {
      q = query(alertsRef, where('category', '==', username), orderBy('createdAt', 'desc'));
    } else {
      q = query(alertsRef, where('userNamePanic', '==', username), orderBy('createdAt', 'desc'));
    }

    const querySnapshot = await getDocs(q);

    const alerts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return alerts;
  } catch (error) {
    console.error('Error al obtener notificaciones', error);
    return [];
  }
};

export const getNews = async () => {
  try {
    const newsRef = collection(db, 'news');
    const q = query(newsRef, where('status', '==', true), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const newsData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return newsData;
  } catch (error) {
    console.error('Error al obtener noticias', error);
    return [];
  }
};

export const getNewsById = async (id) => {
  try {
    const newsDocRef = doc(db, 'news', id);
    const newsSnap = await getDoc(newsDocRef);

    if (newsSnap.exists()) {
      return {
        id: newsSnap.id,
        ...newsSnap.data(),
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error al obtener la noticia por ID:', error);
    return null;
  }
};

export const softDeleteNews = async (newsId) => {
  const newsRef = doc(db, 'news', newsId);
  await updateDoc(newsRef, {
    status: false,
  });
};

export const updateNews = async (newsId, updatedData) => {
  const newsRef = doc(db, 'news', newsId);
  await updateDoc(newsRef, updatedData);
};

export const updateNotificationStatus = async (id, newStatus) => {
  try {
    const ref = doc(db, 'notifications', id);
    await updateDoc(ref, { status: newStatus });
    console.log(`Estado actualizado a ${newStatus}`);
  } catch (error) {
    console.error('Error al actualizar estado:', error);
  }
};
