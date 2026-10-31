import { ImageResponse } from 'next/og';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const alt = '積みプラ完成作品';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ shareSlug: string }> }) {
  const { shareSlug } = await params;

  let item: any = null;
  try {
    const q = query(
      collection(db, 'garage_items'),
      where('shareSlug', '==', shareSlug),
      where('isPublic', '==', true)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      item = snapshot.docs[0].data();
    }
  } catch (e) {
    console.error(e);
  }

  const name = item?.name ?? 'プラモデル作品';
  const maker = item?.maker ?? '不明';
  const scale = item?.scale ?? '';
  const status = item?.status ?? '完成';
  const imageUrl = item?.imageUrl ?? '';
  const tags: string[] = item?.techniqueTags ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          padding: '40px',
          color: 'white',
          fontFamily: 'sans-serif',
          alignItems: 'center',
        }}
      >
        {/* 左側：キット画像 */}
        <div
          style={{
            width: '480px',
            height: '480px',
            borderRadius: '24px',
            backgroundColor: '#334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '2px solid #475569',
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <div style={{ color: '#94A3B8', fontSize: '24px' }}>NO IMAGE</div>
          )}
        </div>

        {/* 右側：情報 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: '40px',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                backgroundColor: status === '完成' ? '#10B981' : '#F59E0B',
                color: '#000000',
                fontSize: '18px',
                fontWeight: 'bold',
                padding: '4px 16px',
                borderRadius: '20px',
              }}
            >
              {status}
            </div>
            {scale && (
              <div style={{ color: '#94A3B8', fontSize: '20px' }}>{scale}</div>
            )}
          </div>

          <div
            style={{
              fontSize: '40px',
              fontWeight: 900,
              marginTop: '16px',
              lineHeight: 1.2,
              color: '#FFFFFF',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
            }}
          >
            {name}
          </div>

          <div style={{ fontSize: '22px', color: '#94A3B8', marginTop: '12px' }}>
            {maker}
          </div>

          {/* タグリスト */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
              {tags.slice(0, 3).map((tag) => (
                <div
                  key={tag}
                  style={{
                    backgroundColor: '#334155',
                    color: '#CBD5E1',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '16px',
                  }}
                >
                  #{tag}
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: '16px', color: '#64748B', marginTop: '32px' }}>
            積みプラ管理 App
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}