// app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white p-6 sm:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* ヘッダーセクション */}
        <header className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            積みプラ管理アプリ <span className="text-blue-400">-GUNPLA ARCHIVE-</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            あなたの「積んでるプラモデル」と「制作の軌跡」をスマートに管理するアプリ
          </p>
        </header>

        {/* お知らせ（NEWS）セクション：クローズドテスト参加者募集 */}
        <section className="bg-gray-800 border border-blue-500/30 rounded-xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-gray-700 pb-3">
            <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              お知らせ / NEWS
            </span>
            <span className="text-gray-400 text-xs">2026.11.04</span>
          </div>

          <h2 className="text-xl font-bold text-blue-300">
            『積みプラ管理アプリ -GUNPLA ARCHIVE-』クローズドテスト参加者募集のお知らせ
          </h2>

          <div className="text-gray-300 text-sm sm:text-base space-y-3 leading-relaxed">
            <p>
              いつも『GUNPLA ARCHIVE』をご利用いただきありがとうございます。<br />
              このたび、個人で開発を進めておりますスマートフォン向けアプリ『積みプラ管理アプリ -GUNPLA ARCHIVE-』のAndroid版につきまして、Google Playでの正式リリースに向けた「14日間のクローズドテスト（動作確認）」を実施することとなりました。
            </p>
            <p>
              アプリの品質向上にご協力いただけるテスターを募集しております。以下の手順より、どなたでもご参加いただけますので、ぜひお気軽にご参加ください。
            </p>
          </div>

          {/* ご参加の手順 */}
          <div className="bg-gray-900/60 rounded-lg p-4 space-y-2 border border-gray-700">
            <h3 className="font-semibold text-white text-sm sm:text-base flex items-center gap-2">
              📱 ご参加の手順
            </h3>
            <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1.5 pl-2">
              <li>
                <span className="font-medium text-white">Googleグループへの参加</span>
                <p className="text-xs text-gray-400 ml-5 mt-0.5">
                  以下のリンクより、テスト配信用Googleグループにご参加ください（お使いのGoogleアカウントでのログインが必要です）。
                </p>
              </li>
              <li className="pt-1">
                <span className="font-medium text-white">テスト版アプリのインストール</span>
                <p className="text-xs text-gray-400 ml-5 mt-0.5">
                  Googleグループへ参加された方へ、アプリのダウンロード用URL（Google Play）をご案内いたします。
                </p>
              </li>
            </ol>

            {/* Googleグループへの参加リンクボタン */}
            <div className="pt-3 text-center sm:text-left">
              <a
                href="https://groups.google.com/g/gunpla_archive_tester"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors shadow"
              >
                👉 Googleグループへ参加する
              </a>
            </div>
          </div>

          {/* 注意事項 */}
          <div className="border-t border-gray-700/60 pt-3 text-xs text-gray-400 space-y-1">
            <p className="font-medium text-gray-300">⚠️ 注意事項</p>
            <ul className="list-disc list-inside space-y-0.5 pl-1">
              <li>テストへの参加には、Android端末およびGoogleアカウントが必要となります。</li>
              <li>本テストは動作確認および安定性検証を目的としたものです。課金要素や個人情報の収集等は行いません。</li>
            </ul>
          </div>

          <div className="text-center pt-2 text-sm text-gray-400">
            皆様の温かいご協力とフィードバックを、心よりお待ちしております。
          </div>
        </section>

        {/* フッター */}
        <footer className="text-center text-xs text-gray-500 pt-8 border-t border-gray-800">
          &copy; {new Date().getFullYear()} GUNPLA ARCHIVE All Rights Reserved.
        </footer>

      </div>
    </main>
  );
}