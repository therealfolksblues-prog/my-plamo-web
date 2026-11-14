import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';

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

interface GarageItem {
  id: string;
  name: string;
  grade?: string;
  maker?: string;
  scale?: string;
  imageUrl?: string;
  status?: string;
  shareSlug?: string;
  updatedAt?: any;
  createdAt?: any;
}

export default async function PublicGallerySection() {
  const itemsRef = collection(db, 'garage_items');
  const q = query(
    itemsRef,
    where('isPublic', '==', true),
    limit(60)
  );

  const snapshot = await getDocs(q);

  const items: GarageItem[] = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as GarageItem))
    .sort((a, b) => {
      const timeA = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
      const timeB = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
      return timeB - timeA;
    })
    .slice(0, 12);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-6 border-l-4 border-amber-500 pl-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wider">
            みんなの公開ガレージ
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            モデラーたちが登録・製作した最新の公開キット
          </p>
        </div>
        <span className="text-xs text-amber-400 font-mono">
          RECENT WORKS
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
              {item.status && (
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
              )}
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
    </section>
  );
}