New-Item -ItemType Directory -Force -Path "app/my-garage" | Out-Null
@'
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User } from 'firebase/auth';
import {
  Firestore,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import {
  FirebaseStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { GRADE_OPTIONS, resizeImageFile } from './ManualAddAndProfileModals';

export const AVAILABLE_TECHNIQUE_TAGS = [
  '素組み',
  'パチ組み',
  'スミ入れ',
  '部分塗装',
  '全塗装',
  'ウェザリング',
  '水転写デカール',
  '改修・改造',
  'トップコート',
];

export interface EditableGarageItem {
  id: string;
  name: string;
  maker: string;
  scale: string;
  grade: string;
  status: string;
  imageUrl: string;
  photoUrls: string[];
  memo: string;
  paintMemo: string;
  techniqueTags: string[];
  isPublic: boolean;
  shareSlug: string;
  completedAtMs: number | null;
  updatedAtMs: number;
}

interface ItemEditModalProps {
  item: EditableGarageItem | null;
  onClose: () => void;
  user: User;
  userSlug: string;
  db: Firestore;
  storage: FirebaseStorage;
  onUpdated: () => void;
}

async function computeFixedSlug(docId: string, userSlug: string): Promise<string> {
  const data = new TextEncoder().encode(docId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 6);
  return userSlug ? `${userSlug}-${hashHex}` : hashHex;
}

export default function ItemEditModal({
  item,
  onClose,
  user,
  userSlug,
  db,
  storage,
  onUpdated,
}: ItemEditModalProps) {
  const [name, setName] = useState('');
  const [maker, setMaker] = useState('');
  const [scale, setScale] = useState('');
  const [grade, setGrade] = useState('HG');
  const [status, setStatus] = useState('積み');
  const [completedDate, setCompletedDate] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [memo, setMemo] = useState('');
  const [paintMemo, setPaintMemo] = useState('');

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [shareSlug, setShareSlug] = useState('');

  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);

  useEffect(() => {
    if (!item) return;
    setName(item.name);
    setMaker(item.maker);
    setScale(item.scale);
    setGrade(item.grade || 'HG');
    setStatus(item.status || '積み');
    setSelectedTags(item.techniqueTags || []);
    setIsPublic(item.isPublic);
    setMemo(item.memo || '');
    setPaintMemo(item.paintMemo || '');
    setPhotoUrls(item.photoUrls || []);
    setMainImageUrl(item.imageUrl || '');
    setShareSlug(item.shareSlug || '');

    if (item.completedAtMs) {
      const d = new Date(item.completedAtMs);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setCompletedDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setCompletedDate('');
    }
  }, [item]);

  if (!item) return null;

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleStatusChange = (nextStatus: string) => {
    setStatus(nextStatus);
    if (nextStatus === '完成' && !completedDate) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setCompletedDate(`${yyyy}-${mm}-${dd}`);
    }
  };

  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxPhotos = 10;
    if (photoUrls.length + files.length > maxPhotos) {
      alert(`写真は1作品につき最大${maxPhotos}枚まで登録できます（現在${photoUrls.length}枚）`);
      e.target.value = '';
      return;
    }

    setUploadingPhotos(true);
    try {
      const timestamp = Date.now();
      const uploadedUrls = await Promise.all(
        files.map(async (file, index) => {
          const resizedBlob = await resizeImageFile(file, 1200, 0.82);
          const fileName = `${timestamp}_${index}.jpg`;
          const storageRef = ref(
            storage,
            `users/${user.uid}/garage_items/${item.id}/${fileName}`
          );
          await uploadBytes(storageRef, resizedBlob, { contentType: 'image/jpeg' });
          return await getDownloadURL(storageRef);
        })
      );

      const nextMain = mainImageUrl || uploadedUrls[0];
      await updateDoc(doc(db, 'garage_items', item.id), {
        imageUrl: nextMain,
        photoUrls: arrayUnion(...uploadedUrls),
        updatedAt: serverTimestamp(),
      });

      setPhotoUrls((prev) => [...prev, ...uploadedUrls]);
      setMainImageUrl(nextMain);
      onUpdated();
    } catch (err) {
      console.error('Photo upload failed:', err);
      alert('写真のアップロードに失敗しました。');
    } finally {
      setUploadingPhotos(false);
      e.target.value = '';
    }
  };

  const handleSelectMainPhoto = async (url: string) => {
    if (url === mainImageUrl) return;
    try {
      await updateDoc(doc(db, 'garage_items', item.id), {
        imageUrl: url,
        updatedAt: serverTimestamp(),
      });
      setMainImageUrl(url);
      onUpdated();
    } catch (err) {
      console.error('Failed to change main photo:', err);
    }
  };

  const handleDeletePhoto = async (targetUrl: string) => {
    if (!window.confirm('この画像をギャラリーから削除しますか？')) return;

    try {
      if (targetUrl.startsWith('https://firebasestorage.googleapis.com')) {
        try {
          await deleteObject(ref(storage, targetUrl));
        } catch (storageErr) {
          console.warn('Storage delete skipped:', storageErr);
        }
      }

      const nextList = photoUrls.filter((u) => u !== targetUrl);
      const nextMain =
        mainImageUrl === targetUrl ? (nextList.length > 0 ? nextList[0] : '') : mainImageUrl;

      await updateDoc(doc(db, 'garage_items', item.id), {
        photoUrls: arrayRemove(targetUrl),
        imageUrl: nextMain,
        updatedAt: serverTimestamp(),
      });

      setPhotoUrls(nextList);
      setMainImageUrl(nextMain);
      onUpdated();
    } catch (err) {
      console.error('Failed to delete photo:', err);
      alert('画像の削除に失敗しました。');
    }
  };

  const handleCopyShareUrl = async () => {
    try {
      let targetSlug = shareSlug.trim();
      if (!targetSlug) {
        targetSlug = await computeFixedSlug(item.id, userSlug);
        await updateDoc(doc(db, 'garage_items', item.id), {
          shareSlug: targetSlug,
          isPublic: true,
          authorUid: user.uid,
          updatedAt: serverTimestamp(),
        });
        setShareSlug(targetSlug);
        setIsPublic(true);
        onUpdated();
      }
      const url = `https://www.gunpla-archive.jp/g/${targetSlug}`;
      await navigator.clipboard.writeText(url);
      setCopiedShareUrl(true);
      setTimeout(() => setCopiedShareUrl(false), 2500);
    } catch (err) {
      console.error('Share URL error:', err);
      alert('公開URLのコピーに失敗しました。');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || saving) return;

    setSaving(true);
    try {
      const parsedDate = completedDate
        ? Timestamp.fromDate(new Date(`${completedDate}T00:00:00`))
        : null;

      await updateDoc(doc(db, 'garage_items', item.id), {
        name: trimmedName,
        maker: maker.trim() || '不明',
        scale: scale.trim(),
        grade,
        status,
        isPublic,
        memo,
        paintMemo,
        completedAt: parsedDate,
        techniqueTags: selectedTags,
        updatedAt: serverTimestamp(),
      });

      onUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to update item:', err);
      alert('更新に失敗しました。通信環境をご確認ください。');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (deleting) return;
    if (!window.confirm(`「${item.name}」をガレージから削除しますか？この操作は取り消せません。`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'garage_items', item.id));
      onUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert('削除に失敗しました。');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#1E293B] border border-white/15 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0F172A]/60">
          <h2 className="text-base font-bold text-white">作品データの編集</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none px-1 cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          <div className="space-y-3">
            <div className="aspect-video w-full bg-[#0F172A] border border-white/10 rounded-xl overflow-hidden relative flex items-center justify-center">
              {mainImageUrl ? (
                <Image
                  src={mainImageUrl}
                  alt={name || '作品画像'}
                  fill
                  unoptimized={true}
                  className="object-contain"
                />
              ) : (
                <span className="text-xs text-gray-500">画像が登録されていません</span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-300">
                写真ギャラリー ({photoUrls.length}/10)
                <span className="text-[11px] font-normal text-gray-400 ml-2">
                  ※クリックで表紙に設定
                </span>
              </span>

              <label className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 cursor-pointer transition">
                <span>{uploadingPhotos ? 'アップロード中...' : '＋ 写真を追加（複数可）'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploadingPhotos || photoUrls.length >= 10}
                  onChange={handleUploadPhotos}
                  className="hidden"
                />
              </label>
            </div>

            {photoUrls.length > 0 && (
              <div className="flex gap-2.5 overflow-x-auto py-1">
                {photoUrls.map((url, idx) => {
                  const isMain = url === mainImageUrl;
                  return (
                    <div key={idx} className="relative flex-shrink-0 group">
                      <button
                        type="button"
                        onClick={() => handleSelectMainPhoto(url)}
                        className={`w-16 h-16 rounded-lg overflow-hidden relative border-2 transition cursor-pointer ${
                          isMain
                            ? 'border-amber-500'
                            : 'border-white/15 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Image
                          src={url}
                          alt={`写真 ${idx + 1}`}
                          fill
                          unoptimized={true}
                          className="object-cover"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(url)}
                        title="この画像を削除"
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow cursor-pointer"
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1">
                キット名（タイトル） *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0F172A] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
              />
            </div>

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
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                ステータス
              </label>
              <div className="grid grid-cols-3 gap-1.5">
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-300">完成日</label>
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
                className="w-full bg-[#0F172A] border border-white/15 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              制作手法タグ
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TECHNIQUE_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`text-xs px-3 py-1 rounded-full border font-medium transition cursor-pointer ${
                      active
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-[#0F172A] text-gray-400 border-white/10 hover:border-white/30'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                塗料メモ・レシピ
              </label>
              <textarea
                rows={3}
                value={paintMemo}
                onChange={(e) => setPaintMemo(e.target.value)}
                placeholder="例: 本体白(ガイア EXホワイト)、フレーム(クレオス 焼鉄色)"
                className="w-full bg-[#0F172A] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                制作メモ・一般メモ（保管場所・購入場所など）
              </label>
              <textarea
                rows={3}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="改造ポイントやキットの感想、積みプラの保管場所など"
                className="w-full bg-[#0F172A] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-y"
              />
            </div>
          </div>

          <div className="bg-[#0F172A]/80 border border-white/10 rounded-xl p-4 space-y-3">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-white">Webポートフォリオに公開する</p>
                <p className="text-[11px] text-gray-400">
                  オフにすると、公開ガレージ一覧に表示されなくなります
                </p>
              </div>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 accent-amber-500 cursor-pointer"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleCopyShareUrl}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-amber-400 transition cursor-pointer"
              >
                {copiedShareUrl ? '共有URLをコピーしました！' : '作品ページのURLをコピー'}
              </button>
              {shareSlug && (
                <a
                  href={`/g/${shareSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-300 hover:text-white underline"
                >
                  公開ページを確認 &rarr;
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleDeleteItem}
              disabled={deleting}
              className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
            >
              {deleting ? '削除中...' : 'この作品を削除'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/10 transition cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={saving || uploadingPhotos || !name.trim()}
                className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 text-black font-bold text-xs transition cursor-pointer shadow"
              >
                {saving ? '更新中...' : '変更を保存する'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "app/my-garage/ItemEditModal.tsx" -Encoding UTF8