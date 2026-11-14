import type { MetadataRoute } from 'next';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://gunpla-archive.jp';

  // 1. 固定ページ
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  try {
    // 2. 公開中の作品ページ (/g/[shareSlug])
    const itemsQuery = query(
      collection(db, 'garage_items'),
      where('isPublic', '==', true)
    );
    const itemsSnapshot = await getDocs(itemsQuery);

    const itemRoutes: MetadataRoute.Sitemap = itemsSnapshot.docs.map((doc) => {
      const data = doc.data();
      const slug = data.shareSlug || doc.id;
      const updated = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();

      return {
        url: `${baseUrl}/g/${slug}`,
        lastModified: updated,
        changeFrequency: 'weekly',
        priority: 0.8,
      };
    });

    // 3. モデラー別ポートフォリオページ (/u/[userSlug])
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const userRoutes: MetadataRoute.Sitemap = usersSnapshot.docs
      .map((doc) => doc.data())
      .filter((data) => Boolean(data.userSlug))
      .map((data) => {
        const updated = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();
        return {
          url: `${baseUrl}/u/${data.userSlug}`,
          lastModified: updated,
          changeFrequency: 'weekly',
          priority: 0.7,
        };
      });

    return [...staticRoutes, ...itemRoutes, ...userRoutes];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return staticRoutes;
  }
}