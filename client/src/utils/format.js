/** "3h ago", "2d ago", "14 Mar" */
export function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** 1 -> "1 post", 2 -> "2 posts". Fixes the "1 followers" grammar bug. */
export function plural(count, singular, pluralForm) {
  return `${formatCount(count)} ${count === 1 ? singular : pluralForm || singular + 's'}`;
}

/** 1200 -> "1.2K", 1500000 -> "1.5M" */
export function formatCount(n = 0) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

/** Deterministic colour per username so every avatar looks distinct. */
export function avatarColor(username = '') {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360} 62% 48%)`;
}

export function initials(name = '?') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}
