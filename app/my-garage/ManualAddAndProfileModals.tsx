// app/my-garage/ManualAddAndProfileModals.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User } from 'firebase/auth';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { FirebaseStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const GRADE_OPTIONS = [
  'HG',
  'RG',
  'MG',
  'PG',
  'EG',
  'RE/100',
  'FULL MECHANICS',
  'MEGASIZE',
  'FG',
  'EX',
  '旧キット',
  'SD',
  'その他',
];

export function detectGradeFromName(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes('PG')) return 'PG';
  if (upper.includes('RG')) return 'RG';
  if (upper.includes('MG')) return 'MG';
  if (upper.includes('EG') || upper.includes('ENTRY GRADE')) return 'EG';
  if (upper.includes('RE/100')) return 'RE/100';
  if (upper.includes('FULL MECHANICS')) return 'FULL MECHANICS';
  if (upper.includes('MEGA SIZE') || upper.includes('MEGASIZE')) return 'MEGASIZE';
  if (upper.includes('SD')) return 'SD';
  if (upper.includes('HG')) return 'HG';
  return '';
}

export async function resizeImageFile(
  file: File,
  maxDimension = 1200,
  quality = 0.82
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to compress image'));
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('画像の読み込みに失敗しました'));
    };

    img.src = objectUrl;
  });
}

/* ============================================================================
 * 1. 手動・過去作追加モーダル
 * ========================================================================== */
interface ManualAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  db: Firestore;
  onSaved: () => void;
}

export function ManualAddModal({
  isOpen,
  onClose,
  user,
  db,
  onSaved,
}: ManualAddModalProps) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('HG');
  const [status, setStatus] = useState<'積み' | '制作中' | '完成'>('積み');
  const [completedDate, setCompletedDate] = useState('');
  const [maker, setMaker] = useState('バンダイスピリッツ');
  const [scale, setScale] = useState('1/144');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    const detected = detectGradeFromName(val);
    if (detected) setGrade(detected);
  };

  const handleStatusChange = (nextStatus: '積み' | '制作中' | '完成') => {
    setStatus(nextStatus);
    if (nextStatus === '完成' && !completedDate) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setCompletedDate(`${yyyy}-${mm}-${dd}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || saving) return;

    setSaving(true);
    try {
      const dummyJan = `manual_${Date.now()}`;
      const parsedDate =
        status === '完成' && completedDate
          ? Timestamp.fromDate(new Date(`${completedDate}T00:00:00`))
          : null;

      await addDoc(collection(db, 'garage_items'), {
        userId: user.uid,
        authorUid: user.uid,
        janCode: dummyJan,
        name: trimmedName,
        maker: maker.trim() || '不明',
        scale: scale.trim(),
        grade,
        imageUrl: '',
        status,
        storageLocation: '未設定',
        memo: '',
        paintMemo: '',
        completedAt: parsedDate,
        techniqueTags: [],
        photoUrls: [],
        isPublic: true,
        viewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setName('');
      setGrade('HG');
      setStatus('積み');
      setCompletedDate('');
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to add item:', err);
      alert('キットの登録に失敗しました。通信環境をご確認ください。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#1E293B] border border-white/15 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white">手動・過去作の追加</h2>
            <p className="text-xs text-gray-400">
              箱（バーコード）がないキットや過去作を直接登録できます
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl px-2 cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-amber-400 mb-1">
              キット名 *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="例: HGUC 1/144 ガンダム"
              className="w-full bg-[#0F172A] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-400 mb-1.5">
              グレード
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GRADE_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                    grade === g
                      ? 'bg-amber-500 text-black border-amber-500'
                      : 'bg-[#0F172A] text-gray-300 border-white/10 hover:border-white/30'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-400 mb-1.5">
              ステータス
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['積み', '制作中', '完成'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  className={`text-xs py-2 rounded-xl border font-bold transition cursor-pointer ${
                    status === st
                      ? 'bg-amber-500 text-black border-amber-500'
                      : 'bg-[#0F172A] text-gray-300 border-white/10 hover:border-white/30'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {status === '完成' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-300">
                  完成日（不明なら空白OK）
                </label>
                {completedDate && (
                  <button
                    type="button"
                    onClick={() => setCompletedDate('')}
                    className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                  >
                    クリア
                  </button>
                )}
              </div>
              <input
                type="date"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
                className="w-full bg-[#0F172A] border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                メーカー
              </label>
              <input
                type="text"
                value={maker}
                onChange={(e) => setMaker(e.target.value)}
                className="w-full bg-[#0F172A] border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                スケール
              </label>
              <input
                type="text"
                value={scale}
                onChange={(e) => setScale(e.target.value)}
                className="w-full bg-[#0F172A] border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/10 transition cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 text-black font-bold text-xs transition cursor-pointer"
            >
              {saving ? '登録中...' : 'ガレージに登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================================
 * 2. モデラープロフィール編集モーダル
 * ========================================================================== */
export interface UserProfileData {
  nickname: string;
  userSlug: string;
  bio: string;
  avatarUrl: string;
}

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  db: Firestore;
  storage: FirebaseStorage;
  initialProfile: UserProfileData;
  onSaved: (updated: UserProfileData) => void;
}

export function ProfileEditModal({
  isOpen,
  onClose,
  user,
  db,
  storage,
  initialProfile,
  onSaved,
}: ProfileEditModalProps) {
  const [nickname, setNickname] = useState(initialProfile.nickname);
  const [userSlug, setUserSlug] = useState(initialProfile.userSlug);
  const [bio, setBio] = useState(initialProfile.bio);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setNickname(initialProfile.nickname);
    setUserSlug(initialProfile.userSlug);
    setBio(initialProfile.bio);
    setAvatarUrl(initialProfile.avatarUrl);
  }, [initialProfile, isOpen]);

  if (!isOpen) return null;

  const sanitizedSlug = userSlug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const resizedBlob = await resizeImageFile(file, 800, 0.82);
      const storageRef = ref(storage, `users/${user.uid}/avatar.jpg`);
      await uploadBytes(storageRef, resizedBlob, { contentType: 'image/jpeg' });
      const url = await getDownloadURL(storageRef);
      setAvatarUrl(url);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert('アイコン画像のアップロードに失敗しました。');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!sanitizedSlug) return;
    try {
      await navigator.clipboard.writeText(`https://www.gunpla-archive.jp/u/${sanitizedSlug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('URLのコピーに失敗しました');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const nextData: UserProfileData = {
        nickname: nickname.trim(),
        userSlug: sanitizedSlug,
        bio: bio.trim(),
        avatarUrl,
      };

      await setDoc(
        doc(db, 'users', user.uid),
        {
          ...nextData,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      onSaved(nextData);
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('プロフィールの保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#1E293B] border border-white/15 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-lg font-bold text-white">モデラープロフィール設定</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl px-2 cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* アイコン */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#0F172A] border-2 border-amber-500 relative flex items-center justify-center">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  fill
                  unoptimized={true}
                  className="object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-500">
                  {nickname ? nickname.charAt(0).toUpperCase() : 'M'}
                </span>
              )}
            </div>
            <label className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg">
              {uploadingAvatar ? 'アップロード中...' : 'アイコン画像を変更'}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              モデラーネーム（表示名）
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="例: example-modeller"
              className="w-full bg-[#0F172A] border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              カスタム共有ID (英小文字・数字・ハイフン)
            </label>
            <input
              type="text"
              value={userSlug}
              onChange={(e) => setUserSlug(e.target.value)}
              placeholder="例: shibatz"
              className="w-full bg-[#0F172A] border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* 公開URLプレビュー */}
          <div className="bg-[#0F172A] border border-white/10 rounded-xl p-3 space-y-2">
            <p className="text-[11px] font-bold text-amber-400">
              マイ・ポートフォリオ公開URL
            </p>
            <p className="text-xs text-gray-300 font-mono break-all">
              {sanitizedSlug
                ? `https://www.gunpla-archive.jp/u/${sanitizedSlug}`
                : 'IDを入力すると公開URLが生成されます'}
            </p>
            {sanitizedSlug && (
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="text-[11px] px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold cursor-pointer"
                >
                  {copied ? 'コピーしました！' : 'URLをコピー'}
                </button>
                <a
                  href={`/u/${sanitizedSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] px-3 py-1 rounded-lg bg-amber-500 text-black font-bold hover:bg-amber-400"
                >
                  公開ページを開く &rarr;
                </a>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              自己紹介（得意なジャンル・塗料など）
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="例: HG・RGを中心にエアブラシで全塗装しています！"
              className="w-full bg-[#0F172A] border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-y"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/10 transition cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving || uploadingAvatar}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 text-black font-bold text-xs transition cursor-pointer"
            >
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}