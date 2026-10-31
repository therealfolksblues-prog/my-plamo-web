'use client';

import { useState } from 'react';

export default function GarageItemView({ item, photoUrls }: { item: any; photoUrls: string[] }) {
  const initialImage = item.imageUrl || (photoUrls.length > 0 ? photoUrls[0] : '');
  const [activeImage, setActiveImage] = useState(initialImage);

  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* ヘッダーブランド */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <span className="text-xs font-bold text-amber-400 tracking-wider">TSUMI-PULA ARCHIVE</span>
          <span className="text-xs text-slate-400">積みプラ管理アプリ</span>
        </div>

        {/* メイン作品画像 */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-800/80 border border-slate-700/50 shadow-2xl flex items-center justify-center min-h-[280px]">
          {activeImage ? (
            <img
              src={activeImage}
              alt={item.name}
              className="w-full max-h-[450px] object-contain transition-all duration-300"
            />
          ) : (
            <div className="text-slate-500 text-sm">画像がありません</div>
          )}
        </div>

        {/* 写真ギャラリー（サムネイルタップで切り替え） */}
        {photoUrls.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">写真ギャラリー ({photoUrls.length}枚) - タップして切り替え</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photoUrls.map((url, i) => {
                const isSelected = activeImage === url;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveImage(url)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                      isSelected
                        ? 'border-2 border-amber-400 ring-2 ring-amber-400/30'
                        : 'border border-slate-700 opacity-60 hover:opacity-100'
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
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3">
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
              <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                {item.scale}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black text-white leading-tight">{item.name}</h1>
          <p className="text-sm text-slate-400">メーカー: {item.maker ?? '不明'}</p>

          {/* 制作手法タグ */}
          {item.techniqueTags && item.techniqueTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {item.techniqueTags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs bg-slate-700/50 text-slate-300 px-2.5 py-1 rounded-md border border-slate-600/50"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 塗料メモ・レシピ */}
        {item.paintMemo && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-2">
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">塗料メモ・カラーレシピ</h2>
            <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{item.paintMemo}</p>
          </div>
        )}

        {/* 一般メモ */}
        {item.memo && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">制作メモ</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{item.memo}</p>
          </div>
        )}

        {/* フッター */}
        <div className="text-center pt-8 text-xs text-slate-500">
          Powered by 積みプラ管理 App
        </div>

      </div>
    </main>
  );
}