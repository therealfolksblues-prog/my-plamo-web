import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { connection } from 'next/server';
import GarageItemView from './GarageItemView';

export const instant = false;

interface Props {
  params: Promise<{ shareSlug: string }>;
}

async function getGarageItem(shareSlug: string) {
  try {
    const q = query(
      collection(db, 'garage_items'),
      where('shareSlug', '==', shareSlug),
      where('isPublic', '==', true)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as any;
  } catch (e) {
    console.error('Firestore Read Error:', e);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareSlug } = await params;
  const item = await getGarageItem(shareSlug);

  if (!item) return { title: '作品が見つかりません | 積みプラ管理' };

  const title = `${item.status === '完成' ? '【完成】' : ''}${item.name} (${item.maker ?? ''})`;
  const description = item.paintMemo ? `塗料レシピ: ${item.paintMemo}` : '積みプラ管理アプリからの共有作品です。';

  return {
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
  const item = await getGarageItem(shareSlug);

  if (!item) {
    notFound();
  }

  const photoUrls: string[] = item.photoUrls ?? (item.imageUrl ? [item.imageUrl] : []);

  return <GarageItemView item={item} photoUrls={photoUrls} />;
}