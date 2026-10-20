import type { Metadata } from 'next';
import { GuideView, guideMetadata } from '../guides/GuideView';

/**
 * Short, keyword-rich URL that students actually type and Google actually ranks.
 * The canonical version lives at /guides/nift-previous-year-question-papers — this page renders identical
 * content and points the canonical tag there so we never compete with ourselves.
 */

export const metadata: Metadata = guideMetadata('nift-previous-year-question-papers');

export default function Page() {
  return <GuideView slug="nift-previous-year-question-papers" canonicalPath="/nift-previous-year-question-papers" />;
}
