/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Importar el trigger de Firestore v2 y logger
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import logger from 'firebase-functions/logger';

import admin from 'firebase-admin';
import { Expo } from 'expo-server-sdk';

admin.initializeApp();
const db = admin.firestore();

// Inicializar Expo SDK
const expo = new Expo();

// Cloud Function v2 que se activa al crear un documento en 'panicAlerts'
exports.sendPanicAlertNotification = onDocumentCreated('panicAlerts/{alertId}', async (event) => {
  // 1. Obtener datos de la nueva alerta
  const snap = event.data; // Snapshot del documento
  if (!snap) {
    logger.error('No data associated with the event!');
    return;
  }
  const newAlertData = snap.data();
  const alertCategory = newAlertData.category;
  const userNamePanic = newAlertData.userNamePanic || 'Usuario desconocido';
  const alertId = event.params.alertId; // ID del documento desde event.params

  logger.log(
    `Nueva alerta de pánico [${alertId}] recibida para categoría:`,
    alertCategory,
    'de:',
    userNamePanic
  );

  if (!alertCategory) {
    logger.error('La alerta no tiene categoría. No se enviará notificación.');
    return;
  }

  // 2. Buscar responders de esa categoría en la colección 'users'
  const usersRef = db.collection('users');
  const querySnapshot = await usersRef.where('role', '==', alertCategory).get();

  if (querySnapshot.empty) {
    logger.log('No se encontraron responders para la categoría:', alertCategory);
    return;
  }

  // 3. Recolectar Expo Push Tokens válidos
  const pushTokens = [];
  querySnapshot.forEach((doc) => {
    const userData = doc.data();
    if (userData.expoPushToken && Expo.isExpoPushToken(userData.expoPushToken)) {
      pushTokens.push(userData.expoPushToken);
    } else {
      logger.warn(`Token inválido o ausente para usuario ${doc.id} (${userData.role})`);
    }
  });

  if (pushTokens.length === 0) {
    logger.log('No hay tokens válidos para enviar notificaciones.');
    return;
  }

  logger.log(`Tokens encontrados para ${alertCategory}:`, pushTokens.length);

  // 4. Crear los mensajes de notificación
  const messages = [];
  for (const pushToken of pushTokens) {
    messages.push({
      to: pushToken,
      sound: 'default',
      title: `🚨 Alerta de Pánico: ${alertCategory} 🚨`,
      body: `Nueva alerta recibida de ${userNamePanic}. Toca para ver detalles.`,
      data: { alertId: alertId, type: 'panicAlert' },
      priority: 'high',
      channelId: 'default',
      icon: 'iconoNot',
    });
  }

  // 5. Enviar las notificaciones en lotes
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  logger.log('Enviando notificaciones en', chunks.length, 'lote(s)...');

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      logger.log('Tickets recibidos para el lote:', ticketChunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      logger.error('Error enviando lote de notificaciones:', error);
    }
  }

  const receiptIds = tickets.filter((ticket) => ticket.id).map((ticket) => ticket.id);

  if (receiptIds.length > 0) {
    logger.log('Verificando recibos para:', receiptIds.length, 'tickets.');
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        logger.log('Recibos obtenidos:', receipts);

        for (const receiptId in receipts) {
          const { status, message, details } = receipts[receiptId];
          if (status === 'error') {
            logger.error(`Error en notificación (ID: ${receiptId}): ${message}`, details);
            if (details && details.error === 'DeviceNotRegistered') {
              logger.warn(`Token ${receiptId} no registrado. Considera eliminarlo.`);
            }
          }
        }
      } catch (error) {
        logger.error('Error obteniendo recibos:', error);
      }
    }
  }

  logger.log('Proceso de envío de notificaciones completado.');
});

const { onCall } = require('firebase-functions/v2/https');

exports.updatePanicAlertStatus = onCall(async (request) => {
  const { alertId, newStatus, targetUserId, responderUsername } = request.data;
  logger.log('Recibida solicitud para actualizar estado:', request.data);

  if (!alertId || !newStatus || !targetUserId || !responderUsername) {
    logger.error('Datos incompletos en la solicitud', request.data);
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan datos necesarios (alertId, newStatus, targetUserId, responderUsername).'
    );
  }

  // 2. Actualizar el documento de la alerta en Firestore
  const alertDocRef = db.collection('panicAlerts').doc(alertId);
  try {
    await alertDocRef.update({
      status: newStatus,
      statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      responderUsername: responderUsername, // Guardar quién actualizó
    });
    logger.log(`Alerta ${alertId} actualizada a estado: ${newStatus}`);
  } catch (error) {
    logger.error(`Error al actualizar Firestore para alerta ${alertId}:`, error);
    throw new functions.https.HttpsError(
      'internal',
      'No se pudo actualizar el estado de la alerta.',
      error.message
    );
  }

  // 3. Obtener el token push del usuario que creó la alerta
  const userDocRef = db.collection('users').doc(targetUserId);
  let userToken = null;
  try {
    const userDoc = await userDocRef.get();
    if (userDoc.exists && userDoc.data().expoPushToken) {
      userToken = userDoc.data().expoPushToken;
      if (!Expo.isExpoPushToken(userToken)) {
        logger.warn(`Token inválido encontrado para ${targetUserId}: ${userToken}`);
        userToken = null; // Marcar como inválido
      }
    } else {
      logger.warn(`Usuario ${targetUserId} no encontrado o sin token.`);
    }
  } catch (error) {
    logger.error(`Error al obtener datos del usuario ${targetUserId}:`, error);
    // No lanzamos error aquí, sólo no podremos notificar
  }

  // 4. Enviar notificación push si hay token válido
  if (userToken) {
    let notificationTitle = '';
    let notificationBody = '';

    if (newStatus === 'En Camino') {
      notificationTitle = '¡Ayuda en Camino! 🚓🚒';
      notificationBody = `Un equipo de ${responderUsername} está yendo a tu ubicación.`;
    } else if (newStatus === 'Finalizado') {
      notificationTitle = 'Alerta Finalizada ✅';
      notificationBody = `Tu alerta ha sido marcada como finalizada por ${responderUsername}.`;
    } else {
      // No enviar notificaciones para otros estados si no se desea
      logger.log(`Estado ${newStatus} no configurado para notificación.`);
      return { success: true, message: 'Estado actualizado, sin notificación para este estado.' };
    }

    const message = {
      to: userToken,
      sound: 'default',
      title: notificationTitle,
      body: notificationBody,
      data: { alertId: alertId, type: 'statusUpdate' }, // Datos adicionales
      priority: 'high',
      channelId: 'default', // Asegúrate que coincide con el canal en la app
    };

    try {
      const tickets = await expo.sendPushNotificationsAsync([message]);
      logger.log(`Notificación de estado enviada a ${targetUserId}. Ticket:`, tickets[0]);
    } catch (error) {
      logger.error(`Error al enviar notificación push a ${targetUserId}:`, error);
      // No lanzamos error a la app, la actualización del estado fue exitosa
      return { success: true, message: 'Estado actualizado, pero falló el envío de notificación.' };
    }
  }

  logger.log(`Función updatePanicAlertStatus completada para alerta ${alertId}`);
  return { success: true, message: 'Estado actualizado y notificación (si aplica) enviada.' };
});
