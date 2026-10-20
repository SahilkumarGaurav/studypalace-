import type { Metadata } from 'next';
import { GuideView, guideMetadata } from '../guides/GuideView';

/**
 * Short, keyword-rich URL that students actually type and Google actually ranks.
 * The canonical version lives at /guides/nift-gat-syllabus-pdf — this page renders identical
 * content and points the canonical tag there so we never compete with ourselves.
 */

export const metadata: Metadata = guideMetadata('nift-gat-syllabus-pdf');

export default function Page() {
  return <GuideView slug="nift-gat-syllabus-pdf" canonicalPath="/nift-gat-syllabus-pdf" />;
}
