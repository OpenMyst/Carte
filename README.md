
# Project Overview

This project is a web application built with Next.js that showcases two main features:

1. **Custom 3D Maps**: Utilizes Mapbox to render and interact with custom 3D maps.
2. **Genealogical Tree Visualization**: Leverages ForceGraph3D to display and explore genealogical trees of characters.

The application integrates with Firebase for data storage and retrieval, ensuring that both the map data and genealogical data are dynamically managed and persistent.

## Features

- **3D Map Visualization**: Create and interact with 3D maps using Mapbox, providing a rich and immersive experience.
- **Genealogical Tree**: Visualize complex relationships between characters with an interactive 3D tree using ForceGraph3D.
- **Firebase Integration**: Store and retrieve data such as map markers and genealogical information using Firebase Firestore.

## Installation

To get started with this project, follow these steps:

### Prerequisites

- **Node.js**: Make sure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org/).
- **Firebase Account**: Create a Firebase project and obtain your Firebase configuration details.

### Clone the Repository

```bash
git clone https://github.com/OpenMyst/Carte.git
cd Carte
```

### Install Dependencies

Install the necessary packages using npm or yarn:

```bash
npm install
```

or

```bash
yarn install
```

### Configure Firebase

1. **Create a Firebase Configuration File**: In the root directory of your project, create a file named `firebaseConfig.js` in the `lib` folder (create the `lib` folder if it doesn't exist).

2. **Add Firebase Configuration**: Replace the placeholders with your actual Firebase project configuration.

   **`lib/firebaseConfig.js`**:
   
   ```javascript
   import { initializeApp } from 'firebase/app';
   import { getAuth } from 'firebase/auth';
   import { getFirestore } from 'firebase/firestore';

   const firebaseConfig = {
     apiKey: process.env.FIREBASE_API_KEY,
     authDomain: process.env.FIREBASE_AUTH_DOMAIN,
     projectId: process.env.FIREBASE_PROJECT_ID,
     storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
     messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
     appId: process.env.FIREBASE_APP_ID
   };

   const app = initializeApp(firebaseConfig);

   export const auth = getAuth(app);
   export const db = getFirestore(app);
   export default app;
   ```

3. **Set Up Environment Variables**: Create a `.env.local` file in the root directory and add your Firebase configuration values.

   **`.env.local`**:
   
   ```env
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

### Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

or

```bash
yarn dev
```

Visit `http://localhost:3000` in your browser to view the application.

## Usage

### 3D Map Visualization

- Navigate to the map view to interact with custom 3D maps.
- You can add markers, adjust settings, and explore different locations.

### Genealogical Tree

- Access the genealogical tree view to visualize and explore character relationships.
- The tree is interactive, allowing you to click and expand nodes to see detailed connections.

## Contribution

Feel free to fork the repository and submit pull requests. If you find any issues or have suggestions for improvements, please open an issue in the GitHub repository.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For any questions or feedback, you can reach out to [mystopen@gmail.com](mailto:mystopen@gmail.com).
