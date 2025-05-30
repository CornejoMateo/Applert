# AppAlert (Municipalidad App)

AppAlert is a mobile application built with React Native and Expo, designed to streamline communication between citizens and municipal emergency services like the Police, Fire Department, and Civil Defense. Users can register, log in, submit incident notifications, and authorized personnel can view, respond to, and manage the status of these reports.

## Features

* 🔐 **User Authentication:** Secure login and registration using email/password or username. Includes email verification and password recovery.
* 👥 **Role-Based Access:** Differentiated views and permissions for regular Citizens versus authorized Responders (e.g., Police, Firefighters, Civil Defense).
* 🚨 **Notification Submission:** Allows users to create new incident reports, selecting the appropriate category (Police, Fire, Civil Defense), adding a title, and a detailed description.
* 📊 **Dashboard (`Home` Screen):** Provides quick access to emergency service categories and displays a list of recent notifications.
* 📄 **Alert Details:** Shows the complete information for a specific notification, including description, metadata, and responses.
* 💬 **Response System:** Enables authorized Responders to add comments or updates to specific notifications.
* ✅ **Status Management:** Allows authorized Responders to change the status of a notification (e.g., Pending, In Progress, Resolved).
* 👤 **User Profiles:** Users can view their email and manage their profile picture.

## Tech Stack

* **React Native**
* **Expo**
* **JavaScript**
* **Firebase**
    * Authentication (Email/Password, Email Verification)
    * Firestore (NoSQL Database for users, notifications, responses)
    * Storage (Planned for file attachments)
* **React Navigation** (`@react-navigation/native`, `@react-navigation/stack`)
* **React Context API** (for Auth/User state management)
* **@react-native-picker/picker** (for category selection)
* **expo-image-picker** (for profile picture selection)
* **@react-native-async-storage/async-storage** (for storing profile picture URI)
* **@expo/vector-icons** (specifically Ionicons)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/juanbrusatti/municipalidad-app]
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd Municipalidad-App
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    # or if you use yarn:
    # yarn install
    ```
4.  **Firebase Setup:**
    * You will need a Firebase project with Authentication (Email/Password enabled), Firestore Database, and potentially Storage enabled.

5.  **Run the application:**
    ```bash
    npx expo start
    ```
    Then, scan the QR code with the Expo Go app on your device or run on an emulator/simulator.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues if you find bugs or have suggestions for improvements.

## License
