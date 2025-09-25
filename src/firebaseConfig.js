import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBlSx7Bqes5DDddWQEs7hXWODmfo70H-8g",
  authDomain: "desarrollomovil-b84d8.firebaseapp.com",
  projectId: "desarrollomovil-b84d8",
  storageBucket: "desarrollomovil-b84d8.firebasestorage.app",
  messagingSenderId: "755886925167",
  appId: "1:755886925167:web:f4633c6f52de12c4fbb49a"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export { auth };

