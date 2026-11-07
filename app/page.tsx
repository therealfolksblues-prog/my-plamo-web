// app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white selection:bg-blue-500 selection:text-white">
      
      {/* ヘッダー / ナビゲーション */}
      <header className="border-b border-gray-800/80 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-wider text-blue-400 text-lg">GUNPLA ARCHIVE</span>
          </div>
          <div>
            {/* アプリ公開後にコメントアウトを解除してください
            <a
              href="#download"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-600/25"
            >
              アプリをダウンロード
            </a>
            */}
            <span className="text-xs text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg">
              リリース準備中
            </span>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* 左側：キャッチコピーと導入 */}
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full text-blue-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Google Playにて近日公開予定
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
              積みプラと制作の軌跡を、<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                もっとスマートに。
              </span>
            </h1>
            
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              『積みプラ管理アプリ -GUNPLA ARCHIVE-』は、増え続けるガンプラの積みを整理し、あなたのパチ組みから塗装・完成までの全プロセスを美しくアーカイブするモデラー専用管理アプリです。
            </p>

            {/* ダウンロードボタン（公開後にコメントアウトを外してください）
            <div id="download" className="pt-4 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <a
                href="https://play.google.com/store/apps/details?id=jp.gunpla_archive.app"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white text-gray-950 hover:bg-gray-200 font-bold px-6 py-3.5 rounded-xl transition-all shadow-xl"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a1.45 1.45 0 0 1-.61-1.186V3c0-.495.22-.942.609-1.186zM15.208 13.415l2.122 2.122-11.23 6.486c-.443.256-.998.225-1.41-.077l10.518-8.531zm0-2.83L4.69 2.054c.412-.302.967-.333 1.41-.077l11.23 6.486-2.122 2.122zm1.414 1.414l3.536 2.041c.691.399.691 1.397 0 1.796l-3.536 2.041-2.122-2.122 2.122-2.122z"/>
                </svg>
                <div className="text-left">
                  <div className="text-[10px] uppercase font-normal text-gray-600">Google Play で</div>
                  <div className="text-sm font-semibold -mt-1">手に入れよう</div>
                </div>
              </a>
            </div>
            */}

            <div className="pt-2 text-sm text-gray-400">
              <p>🚀 正式リリースに向けて準備を進めております。今しばらくお待ちください。</p>
            </div>
          </div>

          {/* 右側：アプリアイコンのビジュアル演出 */}
          <div className="flex justify-center">
            <div className="relative">
              {/* 背景の光彩効果 */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-red-600 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
              
              {/* アイコンカード */}
              <div className="relative bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-2xl flex flex-col items-center space-y-4 max-w-xs">
                <img
                  src="public/app_icon.jpg" 
                  alt="GUNPLA ARCHIVE アプリ アイコン"
                  className="w-48 h-48 rounded-2xl shadow-lg border border-gray-700 object-cover"
                />
                <div className="text-center">
                  <h3 className="font-bold text-lg text-white">GUNPLA ARCHIVE</h3>
                  <p className="text-xs text-gray-400">公式スマートフォンアプリ</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 主な機能（Features）セクション */}
      <section className="py-20 bg-gray-900/50 border-t border-b border-gray-800/80">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400">Features</h2>
            <h3 className="text-3xl font-extrabold">モデラーの「欲しい」が詰まった機能</h3>
            <p className="text-gray-400 max-w-xl mx-auto text-sm">
              積みプラの山から作りたいキットをすぐに見つけ出し、あなたの制作記録を快適に残します。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 特徴1 */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3 hover:border-blue-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-lg">
                📦
              </div>
              <h4 className="text-lg font-bold">積みプラ在庫管理</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                HG, RG, MGなどのグレードやスケール、購入日や保管場所をスマートに登録・管理。もう「同じキットを二重買い」しません。
              </p>
            </div>

            {/* 特徴2 */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3 hover:border-blue-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center font-bold text-lg">
                📷
              </div>
              <h4 className="text-lg font-bold">バーコード簡単読み取り</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                バーコードスキャン機能により、キットの情報を素早く検索・登録。めんどうな手入力の手間を大幅に軽減します。
              </p>
            </div>

            {/* 特徴3 */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3 hover:border-blue-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                🎨
              </div>
              <h4 className="text-lg font-bold">制作プロセス・写真記録</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                パチ組み、塗装、スミ入れ、デカール貼りから完成まで、それぞれのステータスや思い出深い写真をタイムライン風に残せます。
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* フッター */}
      <footer className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <div>
          <a href="/privacy" className="hover:text-blue-400 transition-colors">
            プライバシーポリシー
          </a>
        </div>
        <div>
          &copy; 2026 GUNPLA ARCHIVE All Rights Reserved.
        </div>
      </footer>

    </main>
  );
}