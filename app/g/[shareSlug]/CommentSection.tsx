// app/g/[shareSlug]/CommentSection.tsx
'use client';

import { useState, useEffect } from 'react';
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
  addDoc,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

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

interface CommentItem {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorSlug?: string | null;
  text: string;
  createdAtMs: number;
}

interface CommentSectionProps {
  itemId: string;
  itemOwnerId?: string;
}

function formatDateTime(ms: number): string {
  if (!ms) return 'たった今';
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

export default function CommentSection({ itemId, itemOwnerId }: CommentSectionProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{
    name: string;
    avatar: string | null;
    slug: string | null;
  } | null>(null);

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // アプリ内ブラウザ判定
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent || '';
    const inApp = /Twitter|FBAN|FBAV|Instagram|Line\/|MicroMessenger/i.test(ua);
    const android = /Android/i.test(ua);
    setIsInAppBrowser(inApp);
    setIsAndroid(android);
  }, []);

  // ログイン状態とモデラープロフィールの監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserProfile({
              name: data.nickname || data.displayName || currentUser.displayName || 'モデラー',
              avatar: data.avatarUrl || data.photoURL || currentUser.photoURL || null,
              slug: data.userSlug || null,
            });
          } else {
            setUserProfile({
              name: currentUser.displayName || 'モデラー',
              avatar: currentUser.photoURL || null,
              slug: null,
            });
          }
        } catch {
          setUserProfile({
            name: currentUser.displayName || 'モデラー',
            avatar: currentUser.photoURL || null,
            slug: null,
          });
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // コメント一覧の読み込み
  useEffect(() => {
    if (!itemId) return;

    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const q = query(
          collection(db, 'garage_items', itemId, 'comments'),
          orderBy('createdAt', 'asc')
        );
        const snap = await getDocs(q);
        const loaded: CommentItem[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            authorName: data.authorName || 'モデラー',
            authorAvatar: data.authorAvatar || null,
            authorSlug: data.authorSlug || null,
            text: data.text || '',
            createdAtMs: data.createdAt?.toMillis?.() ?? Date.now(),
          };
        });
        setComments(loaded);
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [itemId]);

  const handleCopyUrl = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      setErrorMsg('URLのコピーに失敗しました。ブラウザのメニューからURLをコピーしてください。');
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error?.code === 'auth/popup-blocked') {
        setErrorMsg(
          'ポップアップがブロックされました。ブラウザの設定でポップアップを許可するか、Chrome / Safari で開き直してください。'
        );
      } else if (error?.code !== 'auth/popup-closed-by-user') {
        console.error('Login error:', error);
        setErrorMsg(
          `ログインに失敗しました (${error?.code || 'unknown'})。Chrome または Safari で開き直してお試しください。`
        );
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!user || !trimmed || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);

    const authorName = userProfile?.name || user.displayName || 'モデラー';
    const authorAvatar = userProfile?.avatar || user.photoURL || null;
    const authorSlug = userProfile?.slug || null;

    try {
      const docRef = await addDoc(collection(db, 'garage_items', itemId, 'comments'), {
        userId: user.uid,
        authorName,
        authorAvatar,
        authorSlug,
        text: trimmed,
        createdAt: serverTimestamp(),
      });

      setComments((prev) => [
        ...prev,
        {
          id: docRef.id,
          userId: user.uid,
          authorName,
          authorAvatar,
          authorSlug,
          text: trimmed,
          createdAtMs: Date.now(),
        },
      ]);
      setCommentText('');
    } catch (err: any) {
      console.error('Failed to post comment:', err);
      setErrorMsg('コメントの投稿に失敗しました。通信環境をご確認ください。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (deletingId) return;
    if (!window.confirm('このコメントを削除しますか？')) return;

    setDeletingId(commentId);
    setErrorMsg(null);
    try {
      await deleteDoc(doc(db, 'garage_items', itemId, 'comments', commentId));
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setErrorMsg('コメントの削除に失敗しました。');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="bg-[#1E293B] border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-white">コメント</h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
            {comments.length}
          </span>
        </div>
        {user && (
          <button
            type="button"
            onClick={handleLogout}
            className="text-[11px] text-gray-400 hover:text-gray-200 underline cursor-pointer"
          >
            ログアウト
          </button>
        )}
      </div>

      {/* コメント一覧 */}
      {loadingComments ? (
        <p className="text-xs text-gray-400 py-4 text-center">読み込み中...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-400 py-4 text-center bg-[#0F172A]/50 rounded-xl border border-white/5">
          まだコメントはありません。最初の感想を送ってみましょう！
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const isAuthor = itemOwnerId && comment.userId === itemOwnerId;
            const canDelete =
              user && (user.uid === comment.userId || (itemOwnerId && user.uid === itemOwnerId));

            return (
              <div
                key={comment.id}
                className="bg-[#0F172A]/80 border border-white/5 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-[#1E293B] border border-white/15 flex-shrink-0 relative flex items-center justify-center text-[11px] font-bold text-gray-300">
                      {comment.authorAvatar ? (
                        <Image
                          src={comment.authorAvatar}
                          alt={comment.authorName}
                          fill
                          unoptimized={true}
                          className="object-cover"
                        />
                      ) : (
                        comment.authorName.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      {comment.authorSlug ? (
                        <Link
                          href={`/u/${comment.authorSlug}`}
                          className="text-xs font-bold text-white hover:text-amber-400 transition truncate"
                        >
                          {comment.authorName}
                        </Link>
                      ) : (
                        <span className="text-xs font-bold text-white truncate">
                          {comment.authorName}
                        </span>
                      )}

                      {isAuthor && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          作者
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] font-mono text-gray-500">
                      {formatDateTime(comment.createdAtMs)}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className="text-[11px] text-gray-500 hover:text-red-400 transition cursor-pointer"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words pl-9">
                  {comment.text}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* 投稿フォーム または Googleログイン誘導 */}
      <div className="pt-4 border-t border-white/10">
        {user ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>
                <strong className="text-gray-200">{userProfile?.name}</strong> としてコメント
              </span>
              <span className="font-mono text-[11px]">{commentText.length} / 500</span>
            </div>

            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="作品の感想や質問などを入力してください..."
              className="w-full bg-[#0F172A] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition resize-y"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || commentText.trim().length === 0}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold text-xs transition cursor-pointer"
              >
                {submitting ? '送信中...' : 'コメントを投稿する'}
              </button>
            </div>
          </form>
        ) : isInAppBrowser ? (
          /* アプリ内ブラウザ（X / Instagram / LINE 等）向けの外部ブラウザ誘導カード */
          <div className="bg-[#0F172A]/90 border border-amber-500/30 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-amber-400">
              アプリ内ブラウザからはGoogleログインが制限されています
            </p>
            <p className="text-xs text-gray-300 leading-relaxed">
              {isAndroid
                ? '画面右上の「⋮（メニュー）」をタップし、「Chrome で開く」を選択すると、そのままGoogleアカウントでログインしてコメントを投稿できます。'
                : '画面下のコンパスアイコン（または右上のメニュー）から「Safari で開く」を選択すると、Googleアカウントでログインしてコメントを投稿できます。'}
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition cursor-pointer shadow"
              >
                <span>{copiedUrl ? 'URLをコピーしました！' : 'ページURLをコピー'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* 通常ブラウザ（Chrome / Safari / PC）向けログインUI */
          <div className="bg-[#0F172A]/70 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-300">
              コメントを投稿するにはGoogleアカウントでログインしてください
            </p>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs transition cursor-pointer flex-shrink-0 shadow"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Googleでログイン</span>
            </button>
          </div>
        )}

        {errorMsg && (
          <p className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {errorMsg}
          </p>
        )}
      </div>
    </section>
  );
}