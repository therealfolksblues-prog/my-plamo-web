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
          <h2 className="text-lg font-semibold text-amber-400">
            1. 収集する情報
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            本サービス（積みプラ管理アプリ -GUNPLA ARCHIVE- および公式サイト）では、サービス提供および利便性向上のため、以下の情報を収集・利用します。
          </p>
          <ul className="list-disc list-inside text-sm text-slate-300 pl-2 space-y-1">
            <li>バーコード情報（JANコード）</li>
            <li>登録されたプラモデルの作品情報（品名、写真、メモ、制作ステータス等）</li>
            <li>Firebase Authentication によるユーザー識別 ID (UID)</li>
            <li>広告配信およびアクセス解析のための Cookie・広告識別子（Advertising ID）</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-amber-400">
            2. データの利用目的
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            収集したデータは、ユーザーごとのガレージ管理機能の提供、クラウド上でのデータ同期、Web 公開・SNS 共有ページの生成、および適切な広告配信のために使用されます。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-amber-400">
            3. 広告の配信について（Google AdSense / Google AdMob）
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            当サービスでは、第三者配信の広告サービスとして Web サイトにおいて「Google AdSense」、スマートフォンアプリにおいて「Google AdMob」を利用しています。
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            これらの広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告（パーソナライズ広告）を表示するため、当サイトや他サイトへのアクセスに関する情報（Cookie やモバイル端末の広告識別子等）を使用することがあります。これには氏名、住所、メールアドレス、電話番号などの個人を特定する情報は含まれません。
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            ユーザーは、Google の「
            <a
              href="https://myadcenter.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:underline"
            >
              マイ アド センター（広告設定）
            </a>
            」や端末の設定からパーソナライズ広告を無効にすることができます。詳細は「
            <a
              href="https://policies.google.com/technologies/ads?hl=ja"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:underline"
            >
              Google ポリシーと規約（広告）
            </a>
            」をご確認ください。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-amber-400">
            4. 第三者提供・外部サービス
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            当サービスでは、データ保管・インフラ提供および広告配信のために以下の外部サービスを利用しています。
          </p>
          <ul className="list-disc list-inside text-sm text-slate-300 pl-2 space-y-1">
            <li>Google Firebase（Authentication、Firestore / データベース、Storage）</li>
            <li>Vercel（Webアプリ・共有ページのホスティング）</li>
            <li>Google AdSense / Google AdMob（広告配信）</li>
            <li>外部商品検索 API（プラモデル情報参照用）</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-amber-400">
            5. プライバシーポリシーの変更
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            本ポリシーの内容は、法令の改正やサービスの仕様変更に伴い、予告なく変更されることがあります。変更後のプライバシーポリシーは、本ページに掲載した時点から効力を生じるものとします。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-amber-400">
            6. お問い合わせ
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            本ポリシーや当サービスに関するお問い合わせ、不具合のご報告は、専用のお問い合わせフォームまたは下記メールアドレスまでお願いいたします。
          </p>
          <div className="pt-1">
            <a
              href="https://forms.gle/EERnUPegAnGUazYB8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow"
            >
              お問い合わせフォームを開く &rarr;
            </a>
          </div>
          <p className="text-xs text-slate-400 font-mono bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
            連絡先メールアドレス: support@gunpla-archive.jp
          </p>
        </section>

        <div className="pt-6 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:underline text-slate-400">
            GUNPLA ARCHIVE
          </Link>
          <span>制定日: 2026年10月31日 / 改定日: 2026年11月14日</span>
        </div>

      </div>
    </main>
  );
}