import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBK27wCDFbQYkdNU-uItFP5oEBCsfEn1_k',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ai-mock-interview-5685b.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ai-mock-interview-5685b',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ai-mock-interview-5685b.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '909738901736',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:909738901736:web:91e93d96d796aa4708c95d'
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const provider = new GoogleAuthProvider()

export { auth, provider, signInWithPopup }
