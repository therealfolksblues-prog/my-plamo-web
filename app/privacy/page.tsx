export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 space-y-6">
        <h1 className="text-2xl font-bold text-white border-b border-slate-700 pb-4">
          プライバシーポリシー
        </h1>
        
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-amber-400">1. 収集する情報</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            本アプリ（積みプラ管理）では、サービス提供および利便性向上のため、以下の情報を収集・利用します。
          </p>
          <ul className="list-disc list-inside text-sm text-slate-300 pl-2 space-y-1">
            <li>バーコード情報（JANコード）</li>
            <li>登録されたプラモデルの作品情報（品名、写真、メモ、制作ステータス等）</li>
            <li>Firebase Authentication による匿名ユーザー識別ID</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-amber-400">2. データの利用目的</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            収集したデータは、ユーザーごとのガレージ管理機能の提供、および Web 公開・SNS 共有機能の生成のみに使用されます。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-amber-400">3. 第三者提供・外部サービス</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            当アプリは、データ保管および機能提供のために以下のサードパーティサービスを利用しています。
          </p>
          <ul className="list-disc list-inside text-sm text-slate-300 pl-2 space-y-1">
            <li>Google Firebase（認証・データベース・ストレージ）</li>
            <li>Yahoo! JAPAN / 楽天商品検索 API（商品情報参照）</li>
            <li>Vercel（Web共有ページホスティング）</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-amber-400">4. お問い合わせ</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            本ポリシーに関するお問い合わせは、アプリ提供者までご連絡ください。
          </p>
        </section>

        <div className="pt-6 border-t border-slate-700 text-xs text-slate-500 text-right">
          制定日: 2026年10月31日
        </div>
      </div>
    </main>
  );
}