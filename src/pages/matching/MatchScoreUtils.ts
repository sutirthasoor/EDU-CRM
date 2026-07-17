import type { Tutor, Lead } from '../../types';

export function calculateMatchScore(tutor: Tutor, lead: Lead): number {
  let score = 0;
  const total = 5;
  const subjectMatch = lead.subjects.some((s) => tutor.subjectsHandled.includes(s));
  if (subjectMatch) score++;
  if (tutor.preferredMode === lead.mode || tutor.preferredMode === 'both') score++;
  if (tutor.zone === lead.zone) score++;
  if (tutor.isActive) score++;
  if ((tutor.rating || 0) >= 4) score++;
  return Math.round((score / total) * 100);
}

export function getMatchBadgeColor(score: number): string {
  if (score >= 80) return 'bg-emerald-100 text-emerald-800';
  if (score >= 60) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-700';
}

export function renderStars(rating: number | undefined): string[] {
  const r = rating ?? 0;
  return Array.from({ length: 5 }, (_, i) => (i < Math.round(r) ? 'filled' : 'empty'));
}
