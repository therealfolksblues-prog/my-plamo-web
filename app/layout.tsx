// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // ブラウザのタブや検索結果に表示されるタイトル
  title: "積みプラ管理アプリ -GUNPLA ARCHIVE-",
  // サイトの説明文
  description: "あなたの「積んでるプラモデル」と「制作の軌跡」をスマートに管理するアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {/* ファビコンをカスタム画像に変更する場合（例: /favicon.ico や任意の画像パス） */}
        <link rel="icon" href="/app_icon.png" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
