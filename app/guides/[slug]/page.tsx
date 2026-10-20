import type { Metadata } from 'next';
import { GUIDES } from '@/lib/content';
import { GuideView, guideMetadata } from '../GuideView';

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return guideMetadata(slug);
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GuideView slug={slug} />;
}
