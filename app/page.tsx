// app/page.tsx
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      
      {/* ヘルパー / ヘッダー */}
      <header className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-black tracking-wider text-white">GUNPLA ARCHIVE</span>
        </div>
        <Link 
          href="/privacy" 
          className="text-xs text-slate-400 hover:text-sky-400 transition-colors"
        >
          プライバシーポリシー
        </Link>
      </header>

      {/* メインビジュアル＆コンテンツ */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 flex flex-col items-center text-center space-y-10">
        
        {/* アイコン画像（ランナーフレーム風演出） */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-amber-500 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-900">
            {/* ※ public フォルダに配置したファイル名に合わせて /app_icon.jpg または /app_icon.png を指定してください */}
            <Image 
              src="/app_icon.png" 
              alt="積みプラ管理アプリ アイコン" 
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* キャッチコピー */}
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            あなたの「積んでるプラモ」を<br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400">
              スマートにアーカイブ
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            GUNPLA ARCHIVE（積みプラ管理アプリ）は、バーコード読み取りによる簡単登録や、積み・制作中・完成のステータス管理であなたの模型ライフを快適にサポートします。
          </p>
        </div>

        {/* 特徴カード */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left pt-4">
          <div className="bg-slate-800/40 border border-slate-700/60 p-5 rounded-xl hover:border-slate-600 transition-all">
            <div className="text-red-400 font-bold mb-1 text-sm">01. 簡易登録</div>
            <h3 className="font-semibold text-white mb-1">バーコードで追加</h3>
            <p className="text-xs text-slate-400 leading-relaxed">JANコードを読み取るだけで、プラモデル情報をスムーズにマイガレージへ登録。</p>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/60 p-5 rounded-xl hover:border-slate-600 transition-all">
            <div className="text-amber-400 font-bold mb-1 text-sm">02. ステータス管理</div>
            <h3 className="font-semibold text-white mb-1">制作の軌跡を残す</h3>
            <p className="text-xs text-slate-400 leading-relaxed">「積みプラ」「組立中」「完成」の各段階ごとに、大切なコレクションを整理。</p>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/60 p-5 rounded-xl hover:border-slate-600 transition-all">
            <div className="text-sky-400 font-bold mb-1 text-sm">03. クラウド同期</div>
            <h3 className="font-semibold text-white mb-1">いつでもどこでも</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Firebaseによる安心のデータ管理。スマホアプリと連携していつでも閲覧可能。</p>
          </div>
        </div>

      </div>

      {/* フッター */}
      <footer className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p>&copy; 2026 GUNPLA ARCHIVE All Rights Reserved.</p>
        <div className="flex space-x-6">
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">
            プライバシーポリシー
          </Link>
        </div>
      </footer>

    </main>
  );
}