// app/admin/products/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { initializeApp, getApps } from 'firebase/app';
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
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';

const GRADE_PRESETS = [
  'HG',
  'RG',
  'MG',
  'PG',
  'EG',
  'SD',
  'MGSD',
  'FULL MECHANICS',
  'RE/100',
  '旧キット',
  'その他',
];

const SCALE_PRESETS = ['1/144', '1/100', '1/60', '1/48', 'ノンスケール'];

interface ProductItem {
  id: string;
  janCode: string;
  name: string;
  maker: string;
  scale: string;
  grade: string;
  imageUrl: string;
  updatedAt?: any;
}

export default function AdminProductsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // フォーム状態
  const [janCode, setJanCode] = useState('');
  const [name, setName] = useState('');
  const [maker, setMaker] = useState('BANDAI SPIRITS');
  const [grade, setGrade] = useState('HG');
  const [scale, setScale] = useState('1/144');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // UI・一覧状態
  const [isExisting, setIsExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingJan, setFetchingJan] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [onlyNoImage, setOnlyNoImage] = useState(false);

  const isAuthorized =
    Boolean(user?.email) &&
    Boolean(ADMIN_EMAIL) &&
    user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // 認証監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 商品一覧の取得
  const fetchProductList = useCallback(async () => {
    setLoadingList(true);
    try {
      const q = query(collection(db, 'products'), limit(300));
      const snapshot = await getDocs(q);
      const list: ProductItem[] = snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            janCode: data.janCode || d.id,
            name: data.name || '',
            maker: data.maker || '',
            scale: data.scale || '',
            grade: data.grade || '',
            imageUrl: data.imageUrl || '',
            updatedAt: data.updatedAt,
          };
        })
        .sort((a, b) => {
          const timeA = a.updatedAt?.toMillis?.() ?? 0;
          const timeB = b.updatedAt?.toMillis?.() ?? 0;
          return timeB - timeA;
        });
      setProducts(list);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchProductList();
    }
  }, [isAuthorized, fetchProductList]);

  // Googleログイン
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'ログインに失敗しました。' });
    }
  };

  // フォーム初期化
  const resetForm = () => {
    setJanCode('');
    setName('');
    setMaker('BANDAI SPIRITS');
    setGrade('HG');
    setScale('1/144');
    setImageUrl('');
    setImageFile(null);
    setPreviewUrl('');
    setIsExisting(false);
    setStatusMessage(null);
  };

  // JANコードから既存データを読み込み
  const handleLookupJan = async (targetJan?: string) => {
    const cleanJan = (targetJan ?? janCode).trim();
    if (!cleanJan) {
      setStatusMessage({ type: 'error', text: 'JANコードを入力してください。' });
      return;
    }

    setFetchingJan(true);
    setStatusMessage(null);
    setImageFile(null);

    try {
      const docRef = doc(db, 'products', cleanJan);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        setJanCode(cleanJan);
        setName(data.name || '');
        setMaker(data.maker || 'BANDAI SPIRITS');
        setGrade(data.grade || 'HG');
        setScale(data.scale || '1/144');
        setImageUrl(data.imageUrl || '');
        setPreviewUrl(data.imageUrl || '');
        setIsExisting(true);
        setStatusMessage({
          type: 'info',
          text: `登録済みデータ（JAN: ${cleanJan}）を読み込みました。`,
        });
      } else {
        setJanCode(cleanJan);
        setName('');
        setMaker('BANDAI SPIRITS');
        setGrade('HG');
        setScale('1/144');
        setImageUrl('');
        setPreviewUrl('');
        setIsExisting(false);
        setStatusMessage({
          type: 'info',
          text: `未登録のJANコード（${cleanJan}）です。新規登録できます。`,
        });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'データの読み込みに失敗しました。' });
    } finally {
      setFetchingJan(false);
    }
  };

  // 画像ファイル選択
  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: '画像ファイルを選択してください。' });
      return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // 保存・更新処理
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanJan = janCode.trim();

    if (!cleanJan || !name.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'JANコードとキット名は必須です。',
      });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      let finalImageUrl = imageUrl.trim();

      // 新しい画像ファイルが選択されている場合は Storage へアップロード
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() || 'jpg';
        const storageRef = ref(storage, `products/${cleanJan}_${Date.now()}.${ext}`);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      const productPayload = {
        janCode: cleanJan,
        name: name.trim(),
        maker: maker.trim() || 'BANDAI SPIRITS',
        grade: grade.trim(),
        scale: scale.trim(),
        imageUrl: finalImageUrl,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'products', cleanJan), productPayload, { merge: true });

      setImageUrl(finalImageUrl);
      setPreviewUrl(finalImageUrl);
      setImageFile(null);
      setIsExisting(true);

      setStatusMessage({
        type: 'success',
        text: `「${name.trim()}」（JAN: ${cleanJan}）を保存しました。`,
      });

      await fetchProductList();
    } catch (err: any) {
      console.error('Save error:', err);
      setStatusMessage({
        type: 'error',
        text: `保存に失敗しました: ${err?.message || '権限または通信エラー'}`,
      });
    } finally {
      setSaving(false);
    }
  };

  // 商品削除
  const handleDelete = async () => {
    const cleanJan = janCode.trim();
    if (!cleanJan || !isExisting) return;
    if (!window.confirm(`JAN: ${cleanJan}（${name}）を商品DBから削除しますか？`)) {
      return;
    }

    setSaving(true);
    try {
      await deleteDoc(doc(db, 'products', cleanJan));
      resetForm();
      setStatusMessage({
        type: 'info',
        text: `JAN: ${cleanJan} を削除しました。`,
      });
      await fetchProductList();
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: '削除に失敗しました。' });
    } finally {
      setSaving(false);
    }
  };

  // 一覧のフィルタリング
  const filteredProducts = products.filter((item) => {
    if (onlyNoImage && item.imageUrl) return false;
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.toLowerCase();
    return (
      item.name.toLowerCase().includes(kw) ||
      item.janCode.includes(kw) ||
      item.grade.toLowerCase().includes(kw)
    );
  });

  // ローディング画面
  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center">
        <p className="text-sm text-gray-400">認証状態を確認中...</p>
      </main>
    );
  }

  // 未ログイン画面
  if (!user) {
    return (
      <main className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1E293B] border border-white/10 rounded-2xl p-8 text-center space-y-6 shadow-xl">
          <h1 className="text-xl font-bold text-amber-400">
            GUNPLA ARCHIVE 商品DB管理
          </h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            管理者アカウント（Google）でログインしてください。
          </p>
          <button
            type="button"
            onClick={handleLogin}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-4 rounded-xl transition cursor-pointer"
          >
            Googleアカウントでログイン
          </button>
          <div>
            <Link href="/" className="text-xs text-gray-400 hover:underline">
              &larr; トップページへ戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 管理者以外のアカウントでログインした場合
  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1E293B] border border-red-500/30 rounded-2xl p-8 text-center space-y-5 shadow-xl">
          <h1 className="text-lg font-bold text-red-400">アクセス権限がありません</h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            現在ログイン中のアカウント（<span className="font-mono">{user.email}</span>）には管理者権限がありません。
          </p>
          {!ADMIN_EMAIL && (
            <p className="text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded">
              ※ Vercelに環境変数 NEXT_PUBLIC_ADMIN_EMAIL が設定されていません。
            </p>
          )}
          <button
            type="button"
            onClick={() => signOut(auth)}
            className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold py-2.5 px-5 rounded-lg transition cursor-pointer"
          >
            ログアウトして別アカウントで試す
          </button>
        </div>
      </main>
    );
  }

  // 管理者用メイン画面
  return (
    <main className="min-h-screen bg-[#0F172A] text-white pb-20">
      {/* ヘッダー */}
      <header className="border-b border-white/10 bg-[#0F172A]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-bold text-amber-400 text-sm">
              GUNPLA ARCHIVE
            </Link>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-semibold">
              商品マスタ管理
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-400 hidden sm:inline font-mono">
              {user.email}
            </span>
            <button
              type="button"
              onClick={() => signOut(auth)}
              className="text-gray-400 hover:text-white transition cursor-pointer"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* --- 左カラム：登録・編集フォーム（7/12） --- */}
        <section className="lg:col-span-7 bg-[#1E293B] border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl h-fit">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h1 className="text-lg font-bold flex items-center gap-2">
              {isExisting ? (
                <span className="text-emerald-400">既存商品の編集・画像更新</span>
              ) : (
                <span className="text-amber-400">新規商品の登録</span>
              )}
            </h1>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-gray-300 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              フォームをクリア
            </button>
          </div>

          {statusMessage && (
            <div
              className={`text-xs p-3.5 rounded-xl border leading-relaxed ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-red-500/15 border-red-500/40 text-red-300'
                  : 'bg-blue-500/15 border-blue-500/40 text-blue-300'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* JANコード入力＆読込 */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                JANコード（13桁） <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={janCode}
                  onChange={(e) => setJanCode(e.target.value)}
                  placeholder="例: 4573102650000"
                  className="flex-grow bg-[#0F172A] border border-white/15 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleLookupJan()}
                  disabled={fetchingJan}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex-shrink-0 cursor-pointer"
                >
                  {fetchingJan ? '検索中...' : 'DBから読込'}
                </button>
              </div>
            </div>

            {/* キット名 */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                キット名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: HGUC 1/144 RX-78-2 ガンダム"
                className="w-full bg-[#0F172A] border border-white/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* グレード選択 */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                グレード
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {GRADE_PRESETS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      grade === g
                        ? 'bg-amber-500 text-black font-bold border-amber-500'
                        : 'bg-[#0F172A] text-gray-300 border-white/10 hover:border-amber-500/50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="自由入力も可能"
                className="w-full bg-[#0F172A] border border-white/15 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* スケール・メーカー */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  スケール
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SCALE_PRESETS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScale(s)}
                      className={`text-[11px] px-2 py-1 rounded-lg border transition cursor-pointer ${
                        scale === s
                          ? 'bg-amber-500 text-black font-bold border-amber-500'
                          : 'bg-[#0F172A] text-gray-300 border-white/10 hover:border-amber-500/50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={scale}
                  onChange={(e) => setScale(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  メーカー
                </label>
                <input
                  type="text"
                  value={maker}
                  onChange={(e) => setMaker(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/15 rounded-xl px-4 py-2.5 text-sm mt-7 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* 画像アップロード＆プレビュー */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <label className="block text-xs font-bold text-gray-300">
                商品パッケージ画像（アップロードまたはURL指定）
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* プレビュー枠 */}
                <div className="sm:col-span-4 aspect-square bg-[#0F172A] border border-white/15 rounded-xl overflow-hidden flex items-center justify-center relative">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="プレビュー"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-500">画像なし</span>
                  )}
                </div>

                {/* ドロップ＆ファイル選択エリア */}
                <div className="sm:col-span-8 space-y-3">
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFileSelect(e.dataTransfer.files?.[0]);
                    }}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-amber-500/70 rounded-xl p-4 text-center cursor-pointer transition bg-[#0F172A]/50"
                  >
                    <span className="text-xs font-semibold text-amber-400">
                      クリックして画像を選択 / ここにドロップ
                    </span>
                    <span className="text-[11px] text-gray-400 mt-1">
                      {imageFile
                        ? `選択中: ${imageFile.name}`
                        : 'JPG, PNG, WebP 対応（保存時にStorageへアップロード）'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>

                  <div>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        if (!imageFile) setPreviewUrl(e.target.value);
                      }}
                      placeholder="または画像URLを直接貼り付け (https://...)"
                      className="w-full bg-[#0F172A] border border-white/15 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 保存・削除ボタン */}
            <div className="pt-4 flex items-center justify-between gap-3">
              {isExisting ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="text-xs text-red-400 hover:bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-xl transition cursor-pointer"
                >
                  削除
                </button>
              ) : (
                <div />
              )}

              <button
                type="submit"
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-sm px-8 py-3 rounded-xl transition shadow-lg cursor-pointer"
              >
                {saving
                  ? 'アップロード・保存中...'
                  : isExisting
                  ? '商品情報を更新する'
                  : '商品DBに新規登録する'}
              </button>
            </div>
          </form>
        </section>

        {/* --- 右カラム：登録済み商品マスタ一覧（5/12） --- */}
        <section className="lg:col-span-5 bg-[#1E293B] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl h-fit">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              登録済み商品DB（{filteredProducts.length}件）
            </h2>
            <button
              type="button"
              onClick={fetchProductList}
              className="text-xs text-amber-400 hover:underline cursor-pointer"
            >
              再読込
            </button>
          </div>

          {/* 絞り込み検索 */}
          <div className="space-y-2">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="キット名・JAN・グレードで絞り込み..."
              className="w-full bg-[#0F172A] border border-white/15 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500"
            />
            <label className="inline-flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyNoImage}
                onChange={(e) => setOnlyNoImage(e.target.checked)}
                className="rounded accent-amber-500"
              />
              画像未設定の商品だけ表示する
            </label>
          </div>

          {/* 商品リスト */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {loadingList ? (
              <p className="text-xs text-gray-400 text-center py-8">読み込み中...</p>
            ) : filteredProducts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                該当する商品はありません
              </p>
            ) : (
              filteredProducts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleLookupJan(item.janCode)}
                  className={`w-full text-left p-2.5 rounded-xl border transition flex items-center gap-3 cursor-pointer ${
                    janCode === item.janCode
                      ? 'bg-amber-500/15 border-amber-500'
                      : 'bg-[#0F172A]/80 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-[#1E293B] border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] text-red-400 font-bold">
                        No Img
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="flex items-center gap-1.5">
                      {item.grade && (
                        <span className="text-[10px] font-bold text-amber-400">
                          {item.grade}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-gray-400">
                        {item.janCode}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white truncate mt-0.5">
                      {item.name || '（名称未設定）'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}