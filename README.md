# Applert

Applert es una aplicación móvil desarrollada con **React Native** y **Expo**, diseñada para optimizar la comunicación entre los ciudadanos y los servicios de emergencia municipales como la Policía, Bomberos y Defensa Civil. Los usuarios pueden registrarse, iniciar sesión, enviar notificaciones de incidentes, y el personal autorizado puede verlas, responderlas y gestionar su estado. Además, los usuarios también pueden enviar **alertas de pánico** a los servicios de emergencia municipales.

## Características

* 🔐 **Autenticación de usuarios:** Inicio de sesión y registro seguros utilizando correo electrónico/contraseña o nombre de usuario. Incluye verificación por correo y recuperación de contraseña.

* 👥 **Acceso basado en roles:** Vistas y permisos diferenciados para ciudadanos comunes y servicios autorizados (por ejemplo, Policía, Bomberos, Defensa Civil).

* 🚨 **Envío de notificaciones:** Permite a los usuarios crear reportes de incidentes, eligiendo la categoría correspondiente (Policía, Bomberos, Defensa Civil), añadiendo un título, una descripción detallada y una imagen (opcional).

* 📊 **Panel principal (pantalla de inicio):** Proporciona acceso rápido a las categorías de servicios de emergencia y muestra una lista de notificaciones recientes. Ademas, es posible enviar alertas de panico a los servicios de emergencia, cuya alerta va a contener la ubicacion del ciudadano correspondiente.

* 📄 **Detalles de la alerta:** Muestra toda la información de una notificación específica, incluyendo descripción, metadatos y respuestas.

* 💬 **Sistema de respuestas:** Permite a las entidades agregar comentarios o actualizaciones a notificaciones específicas.

* ✅ **Gestión de estado:** Permite a las entidades cambiar el estado de una notificación (por ejemplo, Pendiente, Resuelta).

## Tecnologías utilizadas

* React Native
* Expo
* JavaScript
* Firebase

  * Autenticación (correo/contraseña, verificación por email)
  * Firestore (base de datos NoSQL para usuarios, notificaciones y respuestas)
  * Storage (planeado para adjuntar archivos)
* React Navigation (`@react-navigation/native`, `@react-navigation/stack`)
* React Context API (para gestión del estado de autenticación/usuario)
* `@react-native-picker/picker` (para seleccionar la categoría)
* `expo-image-picker` (para selección de foto de perfil)
* `@react-native-async-storage/async-storage` (para guardar el URI de la imagen de perfil)
* `@expo/vector-icons` (específicamente Ionicons)

## Instalación

1. **Clonar el repositorio:**

   ```bash
   git clone https://github.com/juanbrusatti/municipalidad-app
   ```

2. **Navegar al directorio del proyecto:**

   ```bash
   cd Municipalidad-App
   ```

3. **Instalar dependencias:**

   ```bash
   npm install
   # o, si usás yarn:
   # yarn install
   ```

4. **Configuración de Firebase:**

   * Necesitás un proyecto en Firebase con:

     * Autenticación habilitada (Email/Password)
     * Firestore habilitado
     * (Opcional) Storage habilitado

5. **Ejecutar la aplicación:**

   ```bash
   npx expo start
   ```

   Luego, escaneá el código QR con la app **Expo Go** en tu dispositivo o ejecutala en un emulador/simulador.