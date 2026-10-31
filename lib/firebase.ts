import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDW33UtGW1t84g05SZCjNZYYxqSHPw5N_I",
  authDomain: "my-plamo-app-dev.firebaseapp.com",
  projectId: "my-plamo-app-dev",
  storageBucket: "my-plamo-app-dev.firebasestorage.app",
  messagingSenderId: "525372916439",
  appId: "1:525372916439:android:b5c655d2e812dcf8bd6692"
};

// 二重初期化の防止
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);