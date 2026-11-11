import { notFound } from 'next/navigation';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';

// Firebase初期化（環境変数を使用）
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export const instant = false;

interface PageProps {
  params: Promise<{
    userSlug: string;
  }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  // 🔽 Next.js App Routerの仕様に合わせて params を await する
  const { userSlug } = await params;

  if (!userSlug) {
    notFound();
  }

  // 1. usersコレクションから userSlug が一致するユーザーを検索
  const usersRef = collection(db, 'users');
  const qUser = query(usersRef, where('userSlug', '==', userSlug), limit(1));
  const userSnapshot = await getDocs(qUser);

  if (userSnapshot.empty) {
    notFound(); // 404ページへ
  }

  const userDoc = userSnapshot.docs[0];
  const userData = userDoc.data();
  const userId = userDoc.id;

  // 2. 該当ユーザーの公開作品（garage_items, isPublic: true）を取得
  const itemsRef = collection(db, 'garage_items');
  const qItems = query(
    itemsRef,
    where('userId', '==', userId),
    where('isPublic', '==', true)
  );
  const itemsSnapshot = await getDocs(qItems);

  const items = itemsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Array<{
    id: string;
    name: string;
    grade: string;
    maker: string;
    scale: string;
    imageUrl: string;
    status: string;
    shareSlug: string;
    updatedAt?: any;
  }>;

  return (
    <main className="min-h-screen bg-[#0F172A] text-white selection:bg-amber-500 selection:text-black">
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* --- プロフィールヘッダー --- */}
        <section className="bg-[#1E293B] border border-white/5 rounded-2xl p-8 mb-10 flex flex-col items-center text-center shadow-xl">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-[#0F172A] border-2 border-amber-500 mb-4 relative">
            {userData.avatarUrl ? (
              <Image
                src={userData.avatarUrl}
                alt={userData.nickname || 'モデラー'}
                fill
                unoptimized={true}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-3xl font-bold">
                {userData.nickname ? userData.nickname.charAt(0).toUpperCase() : 'M'}
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white tracking-wide">
            {userData.nickname || '名無しのモデラー'}
          </h1>
          <p className="text-amber-400 text-sm font-mono mt-1">
            @{userData.userSlug}
          </p>

          {userData.bio && (
            <p className="text-gray-300 text-sm mt-4 max-w-lg leading-relaxed whitespace-pre-wrap">
              {userData.bio}
            </p>
          )}
        </section>

        {/* --- 作品一覧セクション --- */}
        <div className="flex items-center justify-between mb-6 border-l-4 border-amber-500 pl-3">
          <h2 className="text-lg font-bold tracking-wider">公開作品ギャラリー</h2>
          <span className="text-xs text-gray-400 font-mono">
            {items.length} WORKS
          </span>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-[#1E293B] border border-white/5 rounded-xl text-gray-400">
            <p>まだ公開されている作品はありません。</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/g/${item.shareSlug || item.id}`}
                className="bg-[#1E293B] border border-white/5 rounded-xl overflow-hidden hover:border-amber-500/50 transition group flex flex-col"
              >
                <div className="aspect-square bg-[#0F172A] relative overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      unoptimized={true}
                      className="object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                      画像なし
                    </div>
                  )}
                  {/* ステータスバッジ */}
                  <span
                    className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded shadow ${
                      item.status === '完成'
                        ? 'bg-emerald-600 text-white'
                        : item.status === '制作中'
                        ? 'bg-amber-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="p-3 flex flex-col flex-grow justify-between">
                  <div>
                    {item.grade && (
                      <span className="text-[10px] text-amber-400 font-bold">
                        {item.grade}
                      </span>
                    )}
                    <h3 className="text-xs font-bold text-white line-clamp-2 mt-0.5 leading-snug">
                      {item.name}
                    </h3>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 truncate">
                    {item.maker} {item.scale ? `• ${item.scale}` : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}