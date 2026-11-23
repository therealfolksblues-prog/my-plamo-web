// app/my-garage/MyGarageClient.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ItemEditModal, { EditableGarageItem } from './ItemEditModal';
import {
  ManualAddModal,
  ProfileEditModal,
  UserProfileData,
  detectGradeFromName,
} from './ManualAddAndProfileModals';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:
    typeof window !== 'undefined' &&
    window.location.hostname.endsWith('gunpla-archive.jp')
      ? window.location.hostname
      : process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const AUTH_APP_NAME = 'gunpla-auth-app';
const authApp = getApps().some((a) => a.name === AUTH_APP_NAME)
  ? getApp(AUTH_APP_NAME)
  : initializeApp(firebaseConfig, AUTH_APP_NAME);

const auth = getAuth(authApp);
const db = getFirestore(authApp);
const storage = getStorage(authApp);

type StatusFilterType = 'すべて' | '積み' | '制作中' | '完成';

export default function MyGarageClient() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  const [profile, setProfile] = useState<UserProfileData>({
    nickname: '',
    userSlug: '',
    bio: '',
    avatarUrl: '',
  });

  const [items, setItems] = useState<EditableGarageItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [selectedFilter, setSelectedFilter] = useState<StatusFilterType>('すべて');
  const [searchQuery, setSearchQuery] = useState('');

  const [editingItem, setEditingItem] = useState<EditableGarageItem | null>(null);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent || '';
    setIsInAppBrowser(/Twitter|FBAN|FBAV|Instagram|Line\/|MicroMessenger/i.test(ua));
  }, []);

  const loadUserGarageData = useCallback(async (currentUser: User) => {
    setLoadingItems(true);
    try {
      // 1. プロフィール取得
      const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
      if (userSnap.exists()) {
        const d = userSnap.data();
        setProfile({
          nickname: d.nickname || d.displayName || currentUser.displayName || '',
          userSlug: d.userSlug || '',
          bio: d.bio || '',
          avatarUrl: d.avatarUrl || d.photoURL || '',
        });
      } else {
        setProfile({
          nickname: currentUser.displayName || '',
          userSlug: '',
          bio: '',
          avatarUrl: currentUser.photoURL || '',
        });
      }

      // 2. ガレージアイテム全件取得（非公開アイテムも含む）
      const q = query(
        collection(db, 'garage_items'),
        where('userId', '==', currentUser.uid)
      );
      const snap = await getDocs(q);
      const loaded: EditableGarageItem[] = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        const name = data.name || '名称未設定';
        return {
          id: docSnap.id,
          name,
          maker: data.maker || '不明',
          scale: data.scale || '',
          grade: data.grade || detectGradeFromName(name) || 'HG',
          status: data.status || '積み',
          imageUrl: data.imageUrl || '',
          photoUrls: Array.isArray(data.photoUrls) ? data.photoUrls : [],
          memo: data.memo || '',
          paintMemo: data.paintMemo || '',
          techniqueTags: Array.isArray(data.techniqueTags) ? data.techniqueTags : [],
          isPublic: data.isPublic !== false,
          shareSlug: data.shareSlug || '',
          completedAtMs: data.completedAt?.toMillis?.() ?? null,
          updatedAtMs:
            data.updatedAt?.toMillis?.() ?? data.createdAt?.toMillis?.() ?? 0,
        };
      });

      // 更新日時の新しい順に並べ替え
      loaded.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      setItems(loaded);
    } catch (err) {
      console.error('Failed to load user garage:', err);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        loadUserGarageData(currentUser);
      } else {
        setItems([]);
      }
    });
    return () => unsubscribe();
  }, [loadUserGarageData]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user') {
        console.error('Login error:', error);
        alert(
          'ログインに失敗しました。Xなどのアプリ内ブラウザをご利用の場合は、Chrome または Safari で開き直してお試しください。'
        );
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // 件数集計
  const totalCount = items.length;
  const tsumiCount = items.filter((i) => i.status === '積み').length;
  const makingCount = items.filter((i) => i.status === '制作中').length;
  const completeCount = items.filter((i) => i.status === '完成').length;

  // 絞り込み
  const filteredItems = items.filter((item) => {
    if (selectedFilter !== 'すべて' && item.status !== selectedFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      const haystack = [
        item.name,
        item.maker,
        item.grade,
        item.techniqueTags.join(' '),
        item.paintMemo,
        item.memo,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-[#0F172A] text-white selection:bg-amber-500 selection:text-black flex flex-col">
      {/* ヘッダー */}
      <header className="border-b border-white/10 bg-[#0F172A]/85 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="font-bold tracking-wider text-amber-400 text-sm hover:opacity-80 transition truncate"
            >
              GUNPLA ARCHIVE
            </Link>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white/10 text-gray-300">
              WEB管理画面
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              {profile.userSlug && (
                <Link
                  href={`/u/${profile.userSlug}`}
                  className="hidden sm:inline text-xs text-amber-400 hover:underline"
                >
                  公開ガレージを見る &rarr;
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-5xl w-full mx-auto px-4 py-8 flex-grow">
        {authLoading ? (
          <div className="py-24 text-center text-sm text-gray-400">読み込み中...</div>
        ) : !user ? (
          /* --- 未ログイン時の案内・ログインカード --- */
          <div className="max-w-md mx-auto mt-10 bg-[#1E293B] border border-white/10 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            <div className="space-y-2">
              <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                MY GARAGE EDITOR
              </span>
              <h1 className="text-2xl font-bold text-white">マイガレージ管理</h1>
              <p className="text-xs text-gray-300 leading-relaxed">
                PCやスマホのブラウザから、積みプラの整理・塗装レシピの入力・作品写真のアップロードが行えます。
              </p>
            </div>

            {isInAppBrowser ? (
              <div className="bg-[#0F172A] border border-amber-500/30 rounded-xl p-4 text-left space-y-2">
                <p className="text-xs font-bold text-amber-400">
                  アプリ内ブラウザからはログインできません
                </p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  画面のメニューから「Chrome で開く」または「Safari で開く」を選択してからログインしてください。
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-sm transition cursor-pointer shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>Googleアカウントでログイン</span>
              </button>
            )}

            <div className="bg-[#0F172A]/80 border border-white/5 rounded-xl p-3.5 text-left">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                ※Androidアプリで登録したデータを表示・編集するには、先にアプリ内のプロフィール設定から
                <strong className="text-gray-200">「データをGoogleにバックアップ」</strong>
                で同じGoogleアカウントを連携してください。
              </p>
            </div>
          </div>
        ) : (
          /* --- ログイン後のガレージ管理ダッシュボード --- */
          <div className="space-y-6">
            {/* ユーザーバー & アクションボタン */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1E293B] border border-white/10 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#0F172A] border-2 border-amber-500 flex-shrink-0 relative flex items-center justify-center">
                  {profile.avatarUrl ? (
                    <Image
                      src={profile.avatarUrl}
                      alt={profile.nickname || 'モデラー'}
                      fill
                      unoptimized={true}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-gray-400">
                      {(profile.nickname || 'M').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-white truncate">
                    {profile.nickname || '名無しのモデラー'} のガレージ
                  </h1>
                  <p className="text-xs text-gray-400 truncate">
                    {profile.userSlug ? `@${profile.userSlug}` : user.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition cursor-pointer"
                >
                  プロフィール設定
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualAddOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition cursor-pointer shadow"
                >
                  ＋ 手動・過去作を追加
                </button>
              </div>
            </div>

            {/* 件数サマリー */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 bg-[#1E293B] border border-white/10 rounded-2xl p-4 text-center shadow">
              <div>
                <p className="text-[11px] font-bold text-gray-400">所有数</p>
                <p className="text-xl sm:text-2xl font-bold text-white mt-0.5">{totalCount}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400">積み</p>
                <p className="text-xl sm:text-2xl font-bold text-sky-400 mt-0.5">{tsumiCount}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400">制作中</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-400 mt-0.5">
                  {makingCount}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400">完成</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-0.5">
                  {completeCount}
                </p>
              </div>
            </div>

            {/* 検索 & ステータスフィルター */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="キット名・グレード・タグ・塗料メモで検索..."
                className="flex-grow bg-[#1E293B] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
              <div className="flex gap-1.5 overflow-x-auto">
                {(['すべて', '積み', '制作中', '完成'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedFilter(tab)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedFilter === tab
                        ? 'bg-amber-500 text-black'
                        : 'bg-[#1E293B] text-gray-300 border border-white/10 hover:border-white/25'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* キット一覧グリッド */}
            {loadingItems ? (
              <div className="py-20 text-center text-sm text-gray-400">
                ガレージデータを読み込み中...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="bg-[#1E293B]/60 border border-white/10 rounded-2xl p-12 text-center space-y-3">
                <p className="text-sm text-gray-300 font-bold">
                  表示するキットがありません
                </p>
                <p className="text-xs text-gray-400">
                  右上の「＋ 手動・過去作を追加」から登録するか、AndroidアプリでGoogleバックアップ連携を行ってください。
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEditingItem(item)}
                    className="group text-left bg-[#1E293B] border border-white/10 hover:border-amber-500/60 rounded-2xl overflow-hidden shadow-lg transition flex flex-col cursor-pointer"
                  >
                    <div className="aspect-square w-full bg-[#0F172A] relative overflow-hidden">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          unoptimized={true}
                          className="object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">
                          NO IMAGE
                        </div>
                      )}

                      {/* ステータス＆グレードバッジ */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md text-white shadow ${
                            item.status === '完成'
                              ? 'bg-emerald-600/90'
                              : item.status === '制作中'
                              ? 'bg-amber-600/90'
                              : 'bg-blue-600/90'
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.grade && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/90 text-black shadow">
                            {item.grade}
                          </span>
                        )}
                      </div>

                      {/* 非公開バッジ */}
                      {!item.isPublic && (
                        <span className="absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded bg-black/80 text-gray-300 border border-white/15">
                          非公開
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 flex-grow flex flex-col justify-between space-y-2">
                      <div>
                        <h2 className="text-xs sm:text-sm font-bold text-white line-clamp-2 group-hover:text-amber-400 transition">
                          {item.name}
                        </h2>
                        <p className="text-[10px] text-gray-400 mt-1 truncate">
                          {item.maker} {item.scale ? `• ${item.scale}` : ''}
                        </p>
                      </div>

                      {item.techniqueTags.length > 0 && (
                        <p className="text-[10px] font-bold text-amber-400 truncate">
                          {item.techniqueTags
                            .slice(0, 2)
                            .map((t) => `#${t}`)
                            .join(' ')}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* フッター */}
      <footer className="border-t border-white/10 py-8 px-4 text-xs text-gray-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/" className="hover:text-amber-400 transition-colors">
              トップページ
            </Link>
            <Link href="/privacy" className="hover:text-amber-400 transition-colors">
              プライバシーポリシー
            </Link>
            <a
              href="https://forms.gle/EERnUPegAnGUazYB8"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-400 transition-colors"
            >
              お問い合わせ
            </a>
          </div>
          <div>&copy; 2026 GUNPLA ARCHIVE All Rights Reserved.</div>
        </div>
      </footer>

      {/* 各種モーダル */}
      {user && (
        <>
          <ItemEditModal
            item={editingItem}
            onClose={() => setEditingItem(null)}
            user={user}
            userSlug={profile.userSlug}
            db={db}
            storage={storage}
            onUpdated={() => loadUserGarageData(user)}
          />
          <ManualAddModal
            isOpen={isManualAddOpen}
            onClose={() => setIsManualAddOpen(false)}
            user={user}
            db={db}
            onSaved={() => loadUserGarageData(user)}
          />
          <ProfileEditModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            user={user}
            db={db}
            storage={storage}
            initialProfile={profile}
            onSaved={(updated) => setProfile(updated)}
          />
        </>
      )}
    </main>
  );
}