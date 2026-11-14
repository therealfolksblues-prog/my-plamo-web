'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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

  // 塗装・工作タグの取得（配列フィールド名の揺れに対応）
  const rawTags = item.tags ?? item.paintTags ?? item.workTags ?? [];
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
    <main className="min-h-screen bg-[#0F172A] text-white selection:bg-amber-500 selection:text-black pb-20">
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
              @{builderSlug} のガレージへ →
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-8 space-y-8">
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

        {/* --- キット情報・グレード・塗装タグ --- */}
        <section className="bg-[#1E293B] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          {/* バッジ群（ステータス・グレード・スケール） */}
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

          {/* キット名 */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
            {item.name}
          </h1>

          {/* 塗装・工作タグ一覧 */}
          {tags.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-bold text-gray-400 tracking-wider">
                塗装・工作タグ
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
                他の作品を見る →
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
    </main>
  );
}