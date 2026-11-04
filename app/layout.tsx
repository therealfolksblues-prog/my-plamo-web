// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script"; // 追加
import "./globals.css";

export const metadata: Metadata = {
  title: "積みプラ管理アプリ -GUNPLA ARCHIVE-",
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
        <link rel="icon" href="/app_icon.png" />
        
        {/* Google Analytics (GA4) の読み込み */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-KJ9B9W4QZ2" // ←ご自身の測定IDに変更してください
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-KJ9B9W4QZ2'); // ←こちらもご自身の測定IDに変更してください
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}