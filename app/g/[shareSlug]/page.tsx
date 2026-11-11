import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { notFound } from 'next/navigation';
// GarageItemView などのコンポーネントインポート（パスは実際のプロジェクトに合わせて調整してください）
import GarageItemView from '@/components/GarageItemView'; 

// Firebase初期化
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// プリレンダー・動的ルートの設定
export const instant = false;

// データの取得とフォールバック（shareSlug または ドキュメントID）を行うヘルパー関数
async function getGarageData(shareSlug: string) {
  let item: any = null;
  let authorUid: string | null = null;

  // 1. まず shareSlug フィールドとして検索
  const q = query(
    collection(db, 'garage_items'),
    where('shareSlug', '==', shareSlug),
    limit(1)
  );
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    item = { id: docSnap.id, ...docSnap.data() };
    authorUid = item.userId || item.authorUid || null;
  } else {
    // 2. 見つからない場合は「ドキュメントID」として直接取得を試みる
    const docRef = doc(db, 'garage_items', shareSlug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      item = { id: docSnap.id, ...docSnap.data() };
      authorUid = item.userId || item.authorUid || null;
    }
  }

  if (!item) return null;

  // 3. 投稿者プロフィール情報の取得
  let authorProfile: any = null;
  if (authorUid) {
    const userDocRef = doc(db, 'users', authorUid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      authorProfile = userDocSnap.data();
    }
  }

  return { item, authorProfile };
}

interface PageProps {
  params: Promise<{
    shareSlug: string;
  }>;
}

export default async function ItemDetailPage({ params }: PageProps) {
  const { shareSlug } = await params;
  const data = await getGarageData(shareSlug);

  if (!data || !data.item) {
    notFound();
  }

  const photoUrls: string[] = data.item.photoUrls ?? (data.item.imageUrl ? [data.item.imageUrl] : []);

  return (
    <GarageItemView 
      item={data.item} 
      photoUrls={photoUrls} 
      authorProfile={data.authorProfile} 
    />
  );
}