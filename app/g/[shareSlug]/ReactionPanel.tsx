// app/g/[shareSlug]/ReactionPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, updateDoc, increment } from 'firebase/firestore';

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

type ReactionKey =
  | 'likesCount'
  | 'reactPaint'
  | 'reactColor'
  | 'reactDetail'
  | 'reactCheer';

interface ReactionPanelProps {
  itemId: string;
  initialCounts?: {
    likesCount?: number;
    reactPaint?: number;
    reactColor?: number;
    reactDetail?: number;
    reactCheer?: number;
  };
}

const SUB_REACTIONS: { key: Exclude<ReactionKey, 'likesCount'>; emoji: string; label: string }[] = [
  { key: 'reactPaint', emoji: '🎨', label: '塗装・仕上げが素敵' },
  { key: 'reactColor', emoji: '✨', label: 'カラーリング最高' },
  { key: 'reactDetail', emoji: '🛠️', label: '工作・ディテール凄い' },
  { key: 'reactCheer', emoji: '🔥', label: 'このキット好き / 応援！' },
];

export default function ReactionPanel({ itemId, initialCounts }: ReactionPanelProps) {
  const [counts, setCounts] = useState<Record<ReactionKey, number>>({
    likesCount: initialCounts?.likesCount ?? 0,
    reactPaint: initialCounts?.reactPaint ?? 0,
    reactColor: initialCounts?.reactColor ?? 0,
    reactDetail: initialCounts?.reactDetail ?? 0,
    reactCheer: initialCounts?.reactCheer ?? 0,
  });

  const [activeKeys, setActiveKeys] = useState<Record<ReactionKey, boolean>>({
    likesCount: false,
    reactPaint: false,
    reactColor: false,
    reactDetail: false,
    reactCheer: false,
  });

  const [pendingKey, setPendingKey] = useState<ReactionKey | null>(null);

  // ブラウザ保存済みの押下状態を読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ga_reactions_${itemId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setActiveKeys((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // プライベートブラウズ等でlocalStorageが使えない場合は無視
    }
  }, [itemId]);

  const handleToggleReaction = async (key: ReactionKey) => {
    if (pendingKey === key) return;
    setPendingKey(key);

    const isCurrentlyActive = activeKeys[key];
    const delta = isCurrentlyActive ? -1 : 1;

    // 画面表示を即時更新（オプティミスティックUI）
    const nextActive = { ...activeKeys, [key]: !isCurrentlyActive };
    setActiveKeys(nextActive);
    setCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));

    try {
      localStorage.setItem(`ga_reactions_${itemId}`, JSON.stringify(nextActive));
    } catch {
      // 無視
    }

    try {
      const itemRef = doc(db, 'garage_items', itemId);
      await updateDoc(itemRef, {
        [key]: increment(delta),
      });
    } catch (err) {
      console.error('Reaction update failed:', err);
      // 失敗時は元の状態にロールバック
      setActiveKeys(activeKeys);
      setCounts((prev) => ({
        ...prev,
        [key]: Math.max(0, prev[key] - delta),
      }));
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">
            この作品にリアクションを送る
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            ログイン不要・ワンタップでモデラーを応援できます
          </p>
        </div>

        {/* メインの「いいね！」ボタン */}
        <button
          type="button"
          onClick={() => handleToggleReaction('likesCount')}
          disabled={pendingKey === 'likesCount'}
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer shadow ${
            activeKeys.likesCount
              ? 'bg-rose-500 text-white border border-rose-400'
              : 'bg-[#0F172A] text-gray-200 border border-white/15 hover:border-rose-500/60 hover:text-rose-300'
          }`}
        >
          <span className="text-base leading-none">
            {activeKeys.likesCount ? '❤️' : '🤍'}
          </span>
          <span>いいね！</span>
          <span
            className={`font-mono text-xs px-2 py-0.5 rounded-full ${
              activeKeys.likesCount ? 'bg-black/25 text-white' : 'bg-white/10 text-gray-300'
            }`}
          >
            {counts.likesCount}
          </span>
        </button>
      </div>

      {/* 褒めリアクションチップ一覧 */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
        {SUB_REACTIONS.map(({ key, emoji, label }) => {
          const isActive = activeKeys[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleToggleReaction(key)}
              disabled={pendingKey === key}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition cursor-pointer ${
                isActive
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                  : 'bg-[#0F172A]/80 border-white/10 text-gray-300 hover:border-amber-500/50 hover:text-white'
              }`}
            >
              <span>{emoji}</span>
              <span>{label}</span>
              {counts[key] > 0 && (
                <span
                  className={`font-mono text-[11px] ml-0.5 px-1.5 rounded-full ${
                    isActive ? 'bg-amber-500/30 text-amber-100' : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {counts[key]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}