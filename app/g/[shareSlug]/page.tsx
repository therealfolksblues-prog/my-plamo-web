import { cache } from 'react';
import type { Metadata } from 'next';
import { doc, getDoc, collection, query, where, getDocs, limit, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { notFound } from 'next/navigation';
import GarageItemView from './GarageItemView';

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

// FirestoreのTimestamp等をClient Componentへ渡せるプレーンな値に変換
function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data?.toMillis === 'function') {
    return data.toMillis();
  }
  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData);
  }
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeFirestoreData(value);
    }
    return result;
  }
  return data;
}

const getGarageData = cache(async (shareSlug: string) => {
  let item: any = null;
  let authorUid: string | null = null;

  const q = query(
    collection(db, 'garage_items'),
    where('shareSlug', '==', shareSlug),
    limit(1)
  );
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    item = serializeFirestoreData({ id: docSnap.id, ...docSnap.data() });
    authorUid = item.userId || item.authorUid || null;
  } else {
    const docRef = doc(db, 'garage_items', shareSlug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      item = serializeFirestoreData({ id: docSnap.id, ...docSnap.data() });
      authorUid = item.userId || item.authorUid || null;
    }
  }

  if (!item) return null;

  let authorProfile: any = null;
  if (authorUid) {
    const userDocRef = doc(db, 'users', authorUid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      authorProfile = serializeFirestoreData(userDocSnap.data());
    }
  }

  return { item, authorProfile };
});

interface PageProps {
  params: Promise<{
    shareSlug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareSlug } = await params;
  const data = await getGarageData(shareSlug);

  if (!data || !data.item) {
    return {
      title: '作品が見つかりません | GUNPLA ARCHIVE',
    };
  }

  const item = data.item;
  const gradePrefix = item.grade ? `[${item.grade}] ` : '';
  const title = `${gradePrefix}${item.name} | GUNPLA ARCHIVE`;
  const description =
    item.memo ||
    item.paintMemo ||
    `${data.authorProfile?.nickname || data.authorProfile?.displayName || 'モデラー'}さんのガンプラ作品記録`;

  const photoUrls: string[] = item.photoUrls ?? (item.imageUrl ? [item.imageUrl] : []);
  const ogImage = photoUrls.length > 0 ? photoUrls[0] : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://gunpla-archive.jp/g/${shareSlug}`,
      images: ogImage ? [{ url: ogImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
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