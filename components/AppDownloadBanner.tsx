// components/AppDownloadBanner.tsx
'use client';

const GOOGLE_PLAY_URL =
  'https://play.google.com/store/apps/details?id=jp.gunpla_archive.app';

/**
 * ヘッダー右上用のコンパクトなダウンロードボタン
 */
export function HeaderAppDownloadButton() {
  return (
    <a
      href={GOOGLE_PLAY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition shadow-sm flex-shrink-0"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.609 1.814L13.792 12 3.61 22.186a1.98 1.98 0 0 1-.61-1.425V3.239c0-.553.23-1.063.609-1.425zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1.99 1.99 0 0 1 0 3.45l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z" />
      </svg>
      <span>アプリを入手</span>
    </a>
  );
}

/**
 * ページ下部用のアプリ紹介・ダウンロードバナー
 */
export function AppDownloadBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1E293B] via-[#1E293B] to-[#0F172A] border border-amber-500/30 rounded-2xl p-6 sm:p-7 shadow-xl">
      {/* 背景の装飾アクセント */}
      <div className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full bg-amber-500/10 blur-2xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span>ANDROID APP</span>
            <span>•</span>
            <span>無料ダウンロード</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
            あなたのガンプラ制作・積みプラも記録しよう
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            箱のバーコード読み取りで簡単登録。制作進捗や塗装レシピの管理から、Webガレージの公開・SNSシェアまでスマホひとつで完結します。
          </p>
        </div>

        <div className="flex-shrink-0">
          <a
            href={GOOGLE_PLAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-5 py-3 rounded-xl bg-black hover:bg-neutral-900 text-white border border-white/20 hover:border-amber-400/60 transition shadow-lg group"
          >
            {/* Google Play カラフルアイコン */}
            <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M3.61 1.814L13.793 12 3.61 22.186a1.98 1.98 0 0 1-.61-1.425V3.239c0-.553.23-1.063.61-1.425z"
              />
              <path
                fill="#34A853"
                d="M17.296 15.503L13.793 12 3.61 22.186c.445.424 1.11.53 1.724.175l11.962-6.858z"
              />
              <path
                fill="#FBBC05"
                d="M20.505 10.275l-3.209-1.84L13.793 12l3.503 3.503 3.209-1.84a1.99 1.99 0 0 0 0-3.388z"
              />
              <path
                fill="#EA4335"
                d="M5.334 1.639C4.72 1.284 4.055 1.39 3.61 1.814L13.793 12l3.503-3.503L5.334 1.639z"
              />
            </svg>

            <div className="text-left leading-tight">
              <div className="text-[10px] text-gray-400 tracking-wider">
                GET IT ON
              </div>
              <div className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                Google Play で手に入れよう
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}