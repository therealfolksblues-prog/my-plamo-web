'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, updateDoc, increment } from 'firebase/firestore';
import ReactionPanel from './ReactionPanel';
import CommentSection from './CommentSection';

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

interface GarageItemViewProps {
  item: any;
  photoUrls: string[];
  authorProfile: any;
}

export default function GarageItemView({
  item,
  photoUrls,
  authorProfile,
}: GarageItemViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [viewCount, setViewCount] = useState<number>(item.viewCount ?? 0);

  // 閲覧数のカウントアップ（同一セッション内の重複カウントを防止）
  useEffect(() => {
    if (!item?.id) return;

    const storageKey = `viewed_garage_${item.id}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey)) {
      return;
    }

    const incrementView = async () => {
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(storageKey, '1');
        }
        const itemRef = doc(db, 'garage_items', item.id);
        await updateDoc(itemRef, {
          viewCount: increment(1),
        });
        setViewCount((prev) => prev + 1);
      } catch (error) {
        console.error('Failed to increment view count:', error);
      }
    };

    incrementView();
  }, [item?.id]);

  // 制作手法・工作タグの取得（Firestoreの techniqueTags を優先）
  const rawTags =
    item.techniqueTags ?? item.tags ?? item.paintTags ?? item.workTags ?? [];
  const tags: string[] = Array.isArray(rawTags)
    ? rawTags
    : typeof rawTags === 'string' && rawTags.trim() !== ''
    ? rawTags.split(',').map((t) => t.trim())
    : [];

  // ビルダー情報
  const builderName =
    authorProfile?.nickname || authorProfile?.displayName || '名無しのモデラー';
  const builderSlug = authorProfile?.userSlug;
  const builderAvatar = authorProfile?.avatarUrl || authorProfile?.photoURL;

  return (
    <main className="min-h-screen bg-[#0F172A] text-white selection:bg-amber-500 selection:text-black flex flex-col">
      {/* ヘッダー */}
      <header className="border-b border-white/10 bg-[#0F172A]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-bold tracking-wider text-amber-400 text-sm hover:opacity-80 transition"
          >
            GUNPLA ARCHIVE
          </Link>
          {builderSlug && (
            <Link
              href={`/u/${builderSlug}`}
              className="text-xs text-gray-300 hover:text-amber-400 transition"
            >
              @{builderSlug} のガレージへ &rarr;
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-4xl w-full mx-auto px-4 pt-8 pb-16 space-y-8 flex-grow">
        {/* --- メイン画像ギャラリー --- */}
        <section className="space-y-3">
          <div className="aspect-square sm:aspect-[4/3] w-full bg-[#1E293B] border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl">
            {photoUrls.length > 0 ? (
              <Image
                src={photoUrls[selectedImageIndex] || photoUrls[0]}
                alt={item.name || 'ガンプラ作品'}
                fill
                unoptimized={true}
                className="object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                画像は登録されていません
              </div>
            )}
          </div>

          {/* 複数枚ある場合のサムネイル切り替え */}
          {photoUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photoUrls.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden relative flex-shrink-0 border-2 transition ${
                    selectedImageIndex === idx
                      ? 'border-amber-500'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`${item.name} サムネイル ${idx + 1}`}
                    fill
                    unoptimized={true}
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* --- キット情報・グレード・制作手法タグ --- */}
        <section className="bg-[#1E293B] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          {/* バッジ群（ステータス・グレード・スケール ＋ 右端に閲覧数） */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {item.status && (
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded ${
                    item.status === '完成'
                      ? 'bg-emerald-600 text-white'
                      : item.status === '制作中'
                      ? 'bg-amber-600 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {item.status}
                </span>
              )}

              {item.grade && (
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {item.grade}
                </span>
              )}

              {item.scale && (
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/5 text-gray-300 border border-white/10">
                  {item.scale}
                </span>
              )}

              {item.maker && (
                <span className="text-xs px-2.5 py-1 rounded bg-white/5 text-gray-400">
                  {item.maker}
                </span>
              )}
            </div>

            {/* 閲覧数カウンター */}
            <div
              className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-400 bg-[#0F172A]/80 border border-white/10 px-3 py-1 rounded-full"
              title="閲覧数"
            >
              <svg
                className="w-3.5 h-3.5 text-amber-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{viewCount.toLocaleString()}</span>
              <span className="text-[10px] text-gray-500">VIEWS</span>
            </div>
          </div>

          {/* キット名 */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
            {item.name}
          </h1>

          {/* 制作手法・工作タグ一覧 */}
          {tags.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-bold text-gray-400 tracking-wider">
                制作手法・工作タグ
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center text-xs font-medium px-3 py-1 rounded-full bg-[#0F172A] text-amber-300 border border-amber-500/30"
                  >
                    #{tag.replace(/^#/, '')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 制作メモ・塗装レシピ */}
          {(item.memo || item.paintMemo) && (
            <div className="pt-4 border-t border-white/10 space-y-4">
              {item.memo && (
                <div className="space-y-1.5">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    制作メモ
                  </h2>
                  <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {item.memo}
                  </p>
                </div>
              )}

              {item.paintMemo && (
                <div className="space-y-1.5">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    塗装レシピ・使用塗料
                  </h2>
                  <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap bg-[#0F172A]/60 p-4 rounded-xl border border-white/5">
                    {item.paintMemo}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* --- いいね＆褒めリアクションパネル --- */}
        <ReactionPanel
          itemId={item.id}
          initialCounts={{
            likesCount: item.likesCount ?? 0,
            reactPaint: item.reactPaint ?? 0,
            reactColor: item.reactColor ?? 0,
            reactDetail: item.reactDetail ?? 0,
            reactCheer: item.reactCheer ?? 0,
          }}
        />

        {/* --- コメント欄 --- */}
        <CommentSection
          itemId={item.id}
          itemOwnerId={item.userId || item.authorUid}
        />

        {/* --- ビルダー（作者）プロフィール＆ポートフォリオリンク --- */}
        <section className="bg-[#1E293B] border border-white/10 rounded-2xl p-6 shadow-xl">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            BUILDER
          </p>

          {builderSlug ? (
            <Link
              href={`/u/${builderSlug}`}
              className="flex items-center justify-between gap-4 p-3 -m-3 rounded-xl hover:bg-white/5 transition group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#0F172A] border-2 border-amber-500 flex-shrink-0 relative">
                  {builderAvatar ? (
                    <Image
                      src={builderAvatar}
                      alt={builderName}
                      fill
                      unoptimized={true}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                      {builderName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white group-hover:text-amber-400 transition truncate">
                    {builderName}
                  </p>
                  <p className="text-xs text-amber-400/80 font-mono truncate">
                    @{builderSlug}
                  </p>
                </div>
              </div>

              <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg flex-shrink-0 group-hover:bg-amber-500 group-hover:text-black transition">
                他の作品を見る &rarr;
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#0F172A] border border-white/10 flex-shrink-0 flex items-center justify-center text-gray-400 font-bold">
                {builderName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-white">{builderName}</p>
                <p className="text-xs text-gray-400">モデラー</p>
              </div>
            </div>
          )}
        </section>
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