import type { Metadata } from 'next';
import { GuideView, guideMetadata } from '../guides/GuideView';

/**
 * Short, keyword-rich URL that students actually type and Google actually ranks.
 * The canonical version lives at /guides/nift-situation-test-material — this page renders identical
 * content and points the canonical tag there so we never compete with ourselves.
 */

export const metadata: Metadata = guideMetadata('nift-situation-test-material');

export default function Page() {
  return <GuideView slug="nift-situation-test-material" canonicalPath="/nift-situation-test-material" />;
}
