// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#121212', color: '#e0e0e0', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <header style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '32px', color: '#fff', marginBottom: '10px' }}>GUNPLA ARCHIVE</h1>
          <p style={{ fontSize: '16px', color: '#90caf9' }}>あなたの「積んでるプラモデル」と「制作の軌跡」をスマートに管理するアプリ</p>
        </header>

        <section style={{ display: 'grid', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: '#1e1e1e', padding: '24px', borderRadius: '8px', border: '1px solid #333' }}>
            <h3 style={{ color: '#90caf9', marginTop: 0 }}>バーコードで簡単登録</h3>
            <p style={{ color: '#b0b0b0' }}>JANコード読み取りでプラモデル情報を取得し、マイガレージへ簡単に追加できます。</p>
          </div>
          <div style={{ background: '#1e1e1e', padding: '24px', borderRadius: '8px', border: '1px solid #333' }}>
            <h3 style={{ color: '#90caf9', marginTop: 0 }}>ステータス管理</h3>
            <p style={{ color: '#b0b0b0' }}>「積みプラ」「制作中」「完成」のステータスごとにコレクションを整理できます。</p>
          </div>
        </section>

        <footer style={{ textAlign: 'center', marginTop: '60px', borderTop: '1px solid #333', paddingTop: '20px' }}>
          <p style={{ fontSize: '13px', color: '#777' }}>&copy; 2026 GUNPLA ARCHIVE All Rights Reserved.</p>
          <Link href="/privacy" style={{ color: '#90caf9', textDecoration: 'none', fontSize: '14px' }}>
            プライバシーポリシー
          </Link>
        </footer>

      </div>
    </main>
  );
}