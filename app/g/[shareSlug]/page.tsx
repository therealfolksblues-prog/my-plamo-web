// app/g/[shareSlug]/page.tsx
import { cache } from 'react';
import crypto from 'crypto';
import type { Metadata } from 'next';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  getFirestore,
} from 'firebase/firestore';
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

// cacheComponents 環境で動的ルートを許可する設定
export const instant = false;

// FirestoreのTimestamp等をClient Componentへ渡せるプレーンな値に変換
function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data?.toMillis === 'function') {
    return data.toMillis();
  }
  if (data instanceof Date) {
    return data.getTime();
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

function computeShortHash(docId: string): string {
  return crypto.createHash('sha256').update(docId).digest('hex').slice(0, 6);
}

const getGarageData = cache(async (shareSlug: string) => {
  let item: any = null;
  let authorUid: string | null = null;
  let authorProfile: any = null;

  // 1. shareSlug フィールドで検索
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
    // 2. ドキュメントIDそのもので検索
    const docRef = doc(db, 'garage_items', shareSlug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      item = serializeFirestoreData({ id: docSnap.id, ...docSnap.data() });
      authorUid = item.userId || item.authorUid || null;
    }
  }

  // 3. フォールバック: "<userSlug>-<6桁ハッシュ>" 形式からユーザーと作品を逆引き
  if (!item && shareSlug.includes('-')) {
    const lastHyphen = shareSlug.lastIndexOf('-');
    const possibleUserSlug = shareSlug.slice(0, lastHyphen);
    const possibleHash = shareSlug.slice(lastHyphen + 1).toLowerCase();

    if (possibleUserSlug && /^[0-9a-f]{6}$/.test(possibleHash)) {
      const userQ = query(
        collection(db, 'users'),
        where('userSlug', '==', possibleUserSlug),
        limit(1)
      );
      const userSnap = await getDocs(userQ);

      if (!userSnap.empty) {
        const userDoc = userSnap.docs[0];
        authorUid = userDoc.id;
        authorProfile = serializeFirestoreData(userDoc.data());

        const userItemsQ = query(
          collection(db, 'garage_items'),
          where('userId', '==', authorUid)
        );
        const userItemsSnap = await getDocs(userItemsQ);

        const matchedDoc = userItemsSnap.docs.find(
          (d) => computeShortHash(d.id) === possibleHash
        );
        if (matchedDoc) {
          item = serializeFirestoreData({
            id: matchedDoc.id,
            ...matchedDoc.data(),
          });
        }
      }
    }
  }

  if (!item) return null;

  if (authorUid && !authorProfile) {
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
      url: `https://www.gunpla-archive.jp/g/${shareSlug}`,
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

  const photoUrls: string[] =
    data.item.photoUrls ?? (data.item.imageUrl ? [data.item.imageUrl] : []);

  return (
    <GarageItemView
      item={data.item}
      photoUrls={photoUrls}
      authorProfile={data.authorProfile}
    />
  );
}