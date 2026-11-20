// app/PublicGallerySection.tsx
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

// トップページの表示設定
const TARGET_DISPLAY_COUNT = 12; // 合計表示件数
const MAX_ITEMS_PER_USER = 2;   // 1ユーザーあたりの優先表示上限

interface GarageItem {
  id: string;
  userId?: string;
  name: string;
  grade?: string;
  maker?: string;
  scale?: string;
  imageUrl?: string;
  status?: string;
  shareSlug?: string;
  viewCount?: number;
  updatedAt?: any;
  createdAt?: any;
}

// ステータスごとの表示優先度（数値が小さいほど上位に表示）
function getStatusPriority(status?: string): number {
  switch (status) {
    case '完成':
      return 1;
    case '制作中':
      return 2;
    case '積み':
    case '積みプラ':
    default:
      return 3;
  }
}

// 並び替え比較関数（完成 > 制作中 > 積み、同一ステータス内は更新が新しい順）
function compareGarageItems(a: GarageItem, b: GarageItem): number {
  const priorityA = getStatusPriority(a.status);
  const priorityB = getStatusPriority(b.status);
  if (priorityA !== priorityB) {
    return priorityA - priorityB;
  }

  const timeA = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
  const timeB = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
  return timeB - timeA;
}

export default async function PublicGallerySection() {
  const itemsRef = collection(db, 'garage_items');
  // 「積み」が増えても「完成」「制作中」を取りこぼさないよう取得枠を200件に確保
  const q = query(
    itemsRef,
    where('isPublic', '==', true),
    limit(200)
  );

  const snapshot = await getDocs(q);

  const sortedAllItems: GarageItem[] = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as GarageItem))
    .sort(compareGarageItems);

  // 第1パス：1ユーザーあたり MAX_ITEMS_PER_USER 件まで優先抽出
  const selectedItems: GarageItem[] = [];
  const overflowItems: GarageItem[] = [];
  const userCounts = new Map<string, number>();

  for (const item of sortedAllItems) {
    const uid = item.userId || `unknown_${item.id}`;
    const currentCount = userCounts.get(uid) ?? 0;

    if (currentCount < MAX_ITEMS_PER_USER && selectedItems.length < TARGET_DISPLAY_COUNT) {
      selectedItems.push(item);
      userCounts.set(uid, currentCount + 1);
    } else {
      overflowItems.push(item);
    }
  }

  // 第2パス：ユーザー数が少ない初期段階で12件に満たない場合のみ、残りの上位作品で枠を補完
  if (selectedItems.length < TARGET_DISPLAY_COUNT && overflowItems.length > 0) {
    const needed = TARGET_DISPLAY_COUNT - selectedItems.length;
    selectedItems.push(...overflowItems.slice(0, needed));
  }

  // 補完分を含めて再度「完成 > 制作中 > 積み」の順で整列
  const items = selectedItems.sort(compareGarageItems);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-6 border-l-4 border-blue-500 pl-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wider">
            みんなの公開ガレージ
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            完成作品・製作中キットを中心にモデラーたちの最新ガレージを紹介
          </p>
        </div>
        <span className="text-xs text-blue-400 font-mono">
          FEATURED &amp; RECENT
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/g/${item.shareSlug || item.id}`}
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition group flex flex-col"
          >
            <div className="aspect-square bg-gray-950 relative overflow-hidden">
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
                  <span className="text-[10px] text-blue-400 font-bold">
                    {item.grade}
                  </span>
                )}
                <h3 className="text-xs font-bold text-white line-clamp-2 mt-0.5 leading-snug">
                  {item.name}
                </h3>
              </div>

              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-800/80 text-[10px] text-gray-400">
                <span className="truncate">
                  {item.maker} {item.scale ? `• ${item.scale}` : ''}
                </span>
                <span
                  className="inline-flex items-center gap-1 font-mono text-gray-400 flex-shrink-0"
                  title="閲覧数"
                >
                  <svg
                    className="w-3 h-3 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {(item.viewCount ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}