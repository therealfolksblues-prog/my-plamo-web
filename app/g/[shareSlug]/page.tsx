import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { connection } from 'next/server';
import GarageItemView from './GarageItemView';

export const instant = false;

interface Props {
  params: Promise<{ shareSlug: string }>;
}

async function getGarageData(shareSlug: string) {
  try {
    const q = query(
      collection(db, 'garage_items'),
      where('shareSlug', '==', shareSlug),
      where('isPublic', '==', true)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const itemDoc = snapshot.docs[0];
    const itemData = { id: itemDoc.id, ...itemDoc.data() } as any;

    let authorProfile = null;
    if (itemData.authorUid) {
      const userDoc = await getDoc(doc(db, 'users', itemData.authorUid));
      if (userDoc.exists()) {
        authorProfile = userDoc.data();
      }
    }

    return { item: itemData, authorProfile };
  } catch (e) {
    console.error('Firestore Read Error:', e);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareSlug } = await params;
  const data = await getGarageData(shareSlug);

  if (!data || !data.item) return { title: '作品が見つかりません | GUNPLA ARCHIVE' };

  const { item, authorProfile } = data;
  const builderName = authorProfile?.nickname ? `by ${authorProfile.nickname}` : '';
  const title = `${item.status === '完成' ? '【完成】' : ''}${item.name} (${item.maker ?? ''}) ${builderName}`;
  const description = item.paintMemo ? `塗料レシピ: ${item.paintMemo}` : 'GUNPLA ARCHIVEで公開されている作品です。';

  return {
    metadataBase: new URL('https://gunpla-archive.jp'),
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/g/${shareSlug}/opengraph-image`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function SharePage({ params }: Props) {
  await connection();

  const { shareSlug } = await params;
  const data = await getGarageData(shareSlug);

  if (!data || !data.item) {
    notFound();
  }

  const photoUrls: string[] = data.item.photoUrls ?? (data.item.imageUrl ? [data.item.imageUrl] : []);

  return <GarageItemView item={data.item} photoUrls={photoUrls} authorProfile={data.authorProfile} />;
}