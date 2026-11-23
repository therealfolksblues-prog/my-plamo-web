// app/my-garage/page.tsx
import type { Metadata } from 'next';
import MyGarageClient from './MyGarageClient';

export const metadata: Metadata = {
  title: 'マイガレージ管理 | GUNPLA ARCHIVE',
  description: '積みプラ・制作中・完成作品の管理、塗装レシピや写真の編集が行えます。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyGaragePage() {
  return <MyGarageClient />;
}