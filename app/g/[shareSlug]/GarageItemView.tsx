'use client';

import { useState, useEffect } from 'react';

export default function GarageItemView({
  item,
  photoUrls,
  authorProfile,
}: {
  item: any;
  photoUrls: string[];
  authorProfile?: any;
}) {
  const initialImage = item.imageUrl || (photoUrls.length > 0 ? photoUrls[0] : '');
  const [activeImage, setActiveImage] = useState(initialImage);

  // AdSense広告を動的に読み込むための処理
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white py-8 px-4 sm:px-6 selection:bg-blue-500 selection:text-white">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* ヘッダーブランド */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <a href="/" className="font-bold tracking-wider text-blue-400 text-sm hover:underline">
            GUNPLA ARCHIVE
          </a>
          <span className="text-xs text-gray-400">積みプラ管理 & 製作ギャラリー</span>
        </div>

        {/* 製作者（モデラー）プロフィールカード */}
        {authorProfile && (
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 border border-blue-500/40 flex items-center justify-center">
              {authorProfile.avatarUrl ? (
                <img src={authorProfile.avatarUrl} alt={authorProfile.nickname} className="w-full h-full object-cover" />
              ) : (
                <span className="text-blue-400 font-bold text-lg">
                  {authorProfile.nickname?.[0] ?? 'M'}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">BUILDER</span>
                {authorProfile.userSlug && (
                  <span className="text-xs text-gray-400">@{authorProfile.userSlug}</span>
                )}
              </div>
              <h2 className="text-sm font-bold text-white truncate">{authorProfile.nickname ?? '匿名モデラー'}</h2>
              {authorProfile.bio && (
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{authorProfile.bio}</p>
              )}
            </div>
          </div>
        )}

        {/* メイン作品画像 */}
        <div className="relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl flex items-center justify-center min-h-[280px]">
          {activeImage ? (
            <img
              src={activeImage}
              alt={item.name}
              className="w-full max-h-[450px] object-contain transition-all duration-300"
            />
          ) : (
            <div className="text-gray-500 text-sm">画像がありません</div>
          )}
        </div>

        {/* 写真ギャラリー（サムネイルタップで切り替え） */}
        {photoUrls.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">写真ギャラリー ({photoUrls.length}枚) - タップして切り替え</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photoUrls.map((url, i) => {
                const isSelected = activeImage === url;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveImage(url)}
                    className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all ${
                      isSelected
                        ? 'border-2 border-blue-500 ring-2 ring-blue-500/30'
                        : 'border border-gray-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* キット基本情報 */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 space-y-3 shadow-xl">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                item.status === '完成'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : item.status === '制作中'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {item.status ?? '積み'}
            </span>
            {item.scale && (
              <span className="text-xs text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full border border-gray-700">
                {item.scale}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black text-white leading-tight">{item.name}</h1>
          <p className="text-sm text-gray-400">メーカー: {item.maker ?? '不明'}</p>

          {/* 制作手法タグ */}
          {item.techniqueTags && item.techniqueTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {item.techniqueTags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-800/80 text-gray-300 px-2.5 py-1 rounded-md border border-gray-700/60"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 塗料メモ・レシピ */}
        {item.paintMemo && (
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 space-y-2 shadow-xl">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider">塗料メモ・カラーレシピ</h2>
            <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{item.paintMemo}</p>
          </div>
        )}

        {/* 一般メモ */}
        {item.memo && (
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 space-y-2 shadow-xl">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">制作メモ</h2>
            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{item.memo}</p>
          </div>
        )}

        {/* Google AdSense 広告エリア（/g/スラッグ詳細ページ用） */}
        {/*<div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest">スポンサーリンク</p>
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
            data-ad-slot="YYYYYYYYYY"
            data-ad-format="auto"
            data-full-width-responsive="true"
          ></ins>
        </div>*/}

        {/* フッター */}
        <div className="text-center pt-8 text-xs text-gray-500 border-t border-gray-800">
          &copy; 2026 GUNPLA ARCHIVE All Rights Reserved.
        </div>

      </div>
    </main>
  );
}