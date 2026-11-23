// app/u/[userSlug]/page.tsx
import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import PortfolioGallery, { SerializedGarageItem } from './PortfolioGallery';
import {
  HeaderAppDownloadButton,
  AppDownloadBanner,
} from '@/components/AppDownloadBanner';

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

export const instant = false;

interface PageProps {
  params: Promise<{
    userSlug: string;
  }>;
}

const getUserBySlug = cache(async (userSlug: string) => {
  if (!userSlug) return null;

  const usersRef = collection(db, 'users');
  const qUser = query(usersRef, where('userSlug', '==', userSlug), limit(1));
  const userSnapshot = await getDocs(qUser);

  if (userSnapshot.empty) {
    return null;
  }

  const userDoc = userSnapshot.docs[0];
  return {
    id: userDoc.id,
    data: userDoc.data(),
  };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userSlug } = await params;
  const user = await getUserBySlug(userSlug);

  if (!user) {
    return {
      title: 'モデラーが見つかりません | GUNPLA ARCHIVE',
    };
  }

  const userData = user.data;
  const nickname = userData.nickname || '名無しのモデラー';
  const title = `${nickname}のガレージ | GUNPLA ARCHIVE`;
  const description =
    userData.bio || `${nickname}さんの積みプラ・製作作品ポートフォリオ`;
  const avatarUrl = userData.avatarUrl;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `https://gunpla-archive.jp/u/${userSlug}`,
      images: avatarUrl ? [{ url: avatarUrl }] : [],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: avatarUrl ? [avatarUrl] : [],
    },
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { userSlug } = await params;

  const user = await getUserBySlug(userSlug);

  if (!user) {
    notFound();
  }

  const userId = user.id;
  const userData = user.data;

  // 該当ユーザーの公開作品（garage_items, isPublic: true）を取得
  const itemsRef = collection(db, 'garage_items');
  const qItems = query(
    itemsRef,
    where('userId', '==', userId),
    where('isPublic', '==', true)
  );
  const itemsSnapshot = await getDocs(qItems);

  // Client Component へ渡せるプレーンオブジェクトに変換
  const serializedItems: SerializedGarageItem[] = itemsSnapshot.docs.map((doc) => {
    const data = doc.data();
    const rawTags = data.techniqueTags ?? [];
    return {
      id: doc.id,
      name: data.name || '名称未設定',
      grade: data.grade || '',
      maker: data.maker || '',
      scale: data.scale || '',
      imageUrl: data.imageUrl || '',
      status: data.status || '',
      shareSlug: data.shareSlug || doc.id,
      viewCount: typeof data.viewCount === 'number' ? data.viewCount : 0,
      techniqueTags: Array.isArray(rawTags) ? rawTags : [],
      updatedAtMillis:
        data.updatedAt?.toMillis?.() ?? data.createdAt?.toMillis?.() ?? 0,
    };
  });

  return (
    <main className="min-h-screen bg-[#0F172A] text-white selection:bg-amber-500 selection:text-black flex flex-col">
      {/* ヘッダー（個別作品ページとデザイン統一） */}
      <header className="border-b border-white/10 bg-[#0F172A]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="font-bold tracking-wider text-amber-400 text-sm hover:opacity-80 transition truncate"
          >
            GUNPLA ARCHIVE
          </Link>
          <Link
            href="/my-garage"
            className="text-xs font-semibold text-gray-300 hover:text-amber-400 transition"
>
             マイガレージ管理画面
          </Link>
          <HeaderAppDownloadButton />
        </div>
      </header>

      <div className="max-w-4xl w-full mx-auto px-4 pt-8 pb-16 flex-grow">
        {/* --- プロフィールヘッダー --- */}
        <section className="bg-[#1E293B] border border-white/5 rounded-2xl p-8 mb-10 flex flex-col items-center text-center shadow-xl">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-[#0F172A] border-2 border-amber-500 mb-4 relative">
            {userData.avatarUrl ? (
              <Image
                src={userData.avatarUrl}
                alt={userData.nickname || 'モデラー'}
                fill
                unoptimized={true}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-3xl font-bold">
                {userData.nickname ? userData.nickname.charAt(0).toUpperCase() : 'M'}
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white tracking-wide">
            {userData.nickname || '名無しのモデラー'}
          </h1>
          <p className="text-amber-400 text-sm font-mono mt-1">
            @{userData.userSlug}
          </p>

          {userData.bio && (
            <p className="text-gray-300 text-sm mt-4 max-w-lg leading-relaxed whitespace-pre-wrap">
              {userData.bio}
            </p>
          )}
        </section>

        {/* --- フィルター付き公開作品ギャラリー --- */}
        <PortfolioGallery items={serializedItems} />

        {/* --- アプリダウンロード導線バナー --- */}
        <div className="mt-12">
          <AppDownloadBanner />
        </div>
      </div>

      {/* フッター */}
      <footer className="border-t border-white/10 py-8 px-4 text-xs text-gray-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/" className="hover:text-amber-400 transition-colors">
              トップページ
            </Link>
            <Link href="/privacy" className="hover:text-amber-400 transition-colors">
              プライバシーポリシー
            </Link>
            <a
              href="https://forms.gle/EERnUPegAnGUazYB8"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-400 transition-colors"
            >
              お問い合わせ
            </a>
          </div>
          <div>&copy; 2026 GUNPLA ARCHIVE All Rights Reserved.</div>
        </div>
      </footer>
    </main>
  );
}