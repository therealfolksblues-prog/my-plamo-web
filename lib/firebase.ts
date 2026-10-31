import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "my-plamo-app-dev",
  // ※ Firebase Console の「プロジェクト設定」にある config 値を記載します
};

// 二重初期化の防止
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);