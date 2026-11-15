// app/u/[userSlug]/PortfolioGallery.tsx
'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface SerializedGarageItem {
  id: string;
  name: string;
  grade: string;
  maker: string;
  scale: string;
  imageUrl: string;
  status: string;
  shareSlug: string;
  viewCount: number;
  techniqueTags: string[];
  updatedAtMillis: number;
}

interface PortfolioGalleryProps {
  items: SerializedGarageItem[];
}

type StatusFilter = 'ALL' | '完成' | '制作中' | '積み';
type SortOrder = 'newest' | 'views';

export default function PortfolioGallery({ items }: PortfolioGalleryProps) {
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // 合計閲覧数
  const totalViews = useMemo(
    () => items.reduce((sum, item) => sum + item.viewCount, 0),
    [items]
  );

  // ステータスごとの件数カウント（「積み」と「積みプラ」の両方に対応）
  const statusCounts = useMemo(() => {
    return {
      ALL: items.length,
      完成: items.filter((i) => i.status === '完成').length,
      制作中: items.filter((i) => i.status === '制作中').length,
      積み: items.filter((i) => i.status === '積み' || i.status === '積みプラ').length,
    };
  }, [items]);

  // 作品データ内に存在するグレード一覧を自動抽出
  const availableGrades = useMemo(() => {
    const gradeOrder = [
      'HG',
      'RG',
      'MG',
      'PG',
      'EG',
      'MGSD',
      'RE/100',
      'FULL MECHANICS',
      '旧キット',
      'SD',
      'その他',
    ];
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.grade && item.grade.trim() !== '') {
        set.add(item.grade.trim());
      }
    });
    return Array.from(set).sort((a, b) => {
      const idxA = gradeOrder.indexOf(a);
      const idxB = gradeOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [items]);

  // 作品データ内に存在する制作手法タグ一覧を自動抽出
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      item.techniqueTags.forEach((tag) => {
        if (tag && tag.trim() !== '') {
          set.add(tag.trim());
        }
      });
    });
    return Array.from(set);
  }, [items]);

  // フィルタリング＆ソート適用
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // ステータス判定
        if (selectedStatus !== 'ALL') {
          if (selectedStatus === '積み') {
            if (item.status !== '積み' && item.status !== '積みプラ') return false;
          } else if (item.status !== selectedStatus) {
            return false;
          }
        }

        // グレード判定
        if (selectedGrade !== 'ALL' && item.grade !== selectedGrade) {
          return false;
        }

        // 制作手法タグ判定
        if (selectedTag !== 'ALL' && !item.techniqueTags.includes(selectedTag)) {
          return false;
        }

        // キット名・メーカー検索
        if (searchQuery.trim() !== '') {
          const kw = searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(kw);
          const matchMaker = item.maker.toLowerCase().includes(kw);
          if (!matchName && !matchMaker) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'views') {
          return b.viewCount - a.viewCount;
        }
        return b.updatedAtMillis - a.updatedAtMillis;
      });
  }, [items, selectedStatus, selectedGrade, selectedTag, searchQuery, sortOrder]);

  const isFiltered =
    selectedStatus !== 'ALL' ||
    selectedGrade !== 'ALL' ||
    selectedTag !== 'ALL' ||
    searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedStatus('ALL');
    setSelectedGrade('ALL');
    setSelectedTag('ALL');
    setSearchQuery('');
  };

  return (
    <>
      {/* --- 作品一覧セクション見出し --- */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6 border-l-4 border-amber-500 pl-3">
        <h2 className="text-lg font-bold tracking-wider">公開作品ギャラリー</h2>
        <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
          <span>{items.length} WORKS</span>
          <span className="text-white/20">|</span>
          <span className="inline-flex items-center gap-1 text-amber-400">
            <svg
              className="w-3.5 h-3.5"
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
            TOTAL {totalViews.toLocaleString()} VIEWS
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-[#1E293B] border border-white/5 rounded-xl text-gray-400">
          <p>まだ公開されている作品はありません。</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* --- フィルター＆検索コントロールパネル --- */}
          <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
            {/* 1段目：ステータスフィルター ＋ 並び替え */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { key: 'ALL', label: 'すべて' },
                    { key: '完成', label: '完成' },
                    { key: '制作中', label: '制作中' },
                    { key: '積み', label: '積み' },
                  ] as const
                ).map(({ key, label }) => {
                  const active = selectedStatus === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedStatus(key)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        active
                          ? 'bg-amber-500 text-black shadow'
                          : 'bg-[#0F172A] text-gray-300 border border-white/10 hover:border-amber-500/50'
                      }`}
                    >
                      <span>{label}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          active ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400'
                        }`}
                      >
                        {statusCounts[key]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 並び替えセレクト */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <label htmlFor="sort-order" className="text-[11px] text-gray-400">
                  並び順:
                </label>
                <select
                  id="sort-order"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="bg-[#0F172A] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="newest">新しい順</option>
                  <option value="views">閲覧数が多い順</option>
                </select>
              </div>
            </div>

            {/* 2段目：グレードフィルター（2種類以上ある場合に表示） */}
            {availableGrades.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
                <span className="text-[11px] text-gray-400 mr-1">グレード:</span>
                <button
                  type="button"
                  onClick={() => setSelectedGrade('ALL')}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition cursor-pointer ${
                    selectedGrade === 'ALL'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                      : 'bg-[#0F172A]/70 text-gray-400 border border-white/5 hover:text-white'
                  }`}
                >
                  すべて
                </button>
                {availableGrades.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setSelectedGrade(grade)}
                    className={`text-[11px] px-2.5 py-1 rounded-md transition cursor-pointer ${
                      selectedGrade === grade
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                        : 'bg-[#0F172A]/70 text-gray-400 border border-white/5 hover:text-white'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            )}

            {/* 3段目：制作手法タグフィルター（登録されているタグがある場合のみ表示） */}
            {availableTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
                <span className="text-[11px] text-gray-400 mr-1">タグ:</span>
                <button
                  type="button"
                  onClick={() => setSelectedTag('ALL')}
                  className={`text-[11px] px-2.5 py-1 rounded-full transition cursor-pointer ${
                    selectedTag === 'ALL'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                      : 'bg-[#0F172A]/70 text-gray-400 border border-white/5 hover:text-white'
                  }`}
                >
                  すべて
                </button>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`text-[11px] px-2.5 py-1 rounded-full transition cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                        : 'bg-[#0F172A]/70 text-gray-400 border border-white/5 hover:text-white'
                    }`}
                  >
                    #{tag.replace(/^#/, '')}
                  </button>
                ))}
              </div>
            )}

            {/* 4段目：キット名検索バー ＆ 件数・リセット */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
              <div className="relative flex-grow max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="キット名で絞り込み（例: ガンダム, ゾック）..."
                  className="w-full bg-[#0F172A] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
                <svg
                  className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                <span className="text-gray-400 font-mono">
                  表示中: <strong className="text-white">{filteredItems.length}</strong> / {items.length} 件
                </span>
                {isFiltered && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-amber-400 hover:underline text-xs cursor-pointer"
                  >
                    条件をリセット
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* --- 絞り込み後の作品グリッド --- */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-[#1E293B] border border-white/5 rounded-xl space-y-3">
              <p className="text-sm text-gray-400">
                条件に一致する作品が見つかりませんでした。
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 px-4 py-2 rounded-lg hover:bg-amber-500 hover:text-black transition cursor-pointer"
              >
                フィルターを解除する
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
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

                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5 text-[10px] text-gray-400">
                      <span className="truncate">
                        {item.maker} {item.scale ? `• ${item.scale}` : ''}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 font-mono text-gray-400 flex-shrink-0"
                        title="閲覧数"
                      >
                        <svg
                          className="w-3 h-3 text-amber-400"
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
                        {item.viewCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}