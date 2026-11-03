// app/privacy/page.tsx
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 space-y-6 shadow-xl">
        
        <div className="flex justify-between items-center border-b border-slate-700 pb-4">
          <h1 className="text-2xl font-bold text-white">
            プライバシーポリシー
          </h1>
          <Link href="/" className="text-sm text-sky-400 hover:underline">
            &larr; トップページに戻る
          </Link>
        </div>
        
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-amber-400">1. 収集する情報</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            本アプリ（積みプラ管理アプリ）では、サービス提供および利便性向上のため、以下の情報を収集・利用します。
          </p>
          <ul className="list-disc list-inside text-sm text-slate-300 pl-2 space-y-1">
            <li>バーコード情報（JANコード）</li>
            <li>登録されたプラモデルの作品情報（品名、写真、メモ、制作ステータス等）</li>
            <li>Firebase Authentication による匿名ユーザー識別 ID (UID)</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-amber-400">2. データの利用目的</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            収集したデータは、ユーザーごとのガレージ管理機能の提供、クラウド上でのデータ同期、および Web 公開・SNS 共有機能の生成のためにのみ使用されます。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-amber-400">3. 第三者提供・外部サービス</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            当サービスでは、データ保管およびインフラ提供のために以下の外部サービスを利用しています。
          </p>
          <ul className="list-disc list-inside text-sm text-slate-300 pl-2 space-y-1">
            <li>Google Firebase（Authentication、Firestore / データベース）</li>
            <li>Vercel（Webアプリ・共有ページのホスティング）</li>
            <li>外部商品検索 API（プラモデル情報参照用）</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-amber-400">4. プライバシーポリシーの変更</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            本ポリシーの内容は、法令の改正やサービスの仕様変更に伴い、予告なく変更されることがあります。変更後のプライバシーポリシーは、本ページに掲載した時点から効力を生じるものとします。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-amber-400">5. お問い合わせ</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            本ポリシーに関するお問い合わせやご質問は、以下の連絡先までお願いいたします。
          </p>
          <p className="text-sm text-slate-300 font-mono bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
            連絡先メールアドレス: support@gunpla-archive.jp
          </p>
        </section>

        <div className="pt-6 border-t border-slate-700 flex justify-between items-center text-xs text-slate-500">
          <Link href="/" className="hover:underline text-slate-400">
            GUNPLA ARCHIVE
          </Link>
          <span>制定日: 2026年10月31日</span>
        </div>

      </div>
    </main>
  );
}