/**
 * Content script pour Firefox : affiche un badge visuel en haut de la page
 * pour indiquer le groupe virtuel auquel appartient l'onglet.
 */

const BADGE_ID = 'tmp-virtual-group-badge';

const COLOR_MAP: Record<string, string> = {
  grey: '#6b7280',
  blue: '#3b82f6',
  red: '#ef4444',
  yellow: '#eab308',
  green: '#22c55e',
  pink: '#ec4899',
  purple: '#a855f7',
  cyan: '#06b6d4',
  orange: '#f97316',
};

function createOrUpdateBadge(title: string, color: string): void {
  let badge = document.getElementById(BADGE_ID);

  if (!badge) {
    badge = document.createElement('div');
    badge.id = BADGE_ID;
    badge.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 2147483647;
      height: 3px;
      transition: all 0.3s ease;
      pointer-events: none;
    `;

    const label = document.createElement('div');
    label.id = BADGE_ID + '-label';
    label.style.cssText = `
      position: fixed;
      top: 3px;
      left: 8px;
      z-index: 2147483647;
      font-size: 10px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 1px 6px;
      border-radius: 0 0 4px 4px;
      color: white;
      font-weight: 600;
      pointer-events: none;
      opacity: 0.85;
      transition: all 0.3s ease;
    `;

    document.documentElement.appendChild(badge);
    document.documentElement.appendChild(label);
  }

  const bgColor = COLOR_MAP[color] || COLOR_MAP.grey;
  badge.style.backgroundColor = bgColor;

  const label = document.getElementById(BADGE_ID + '-label');
  if (label) {
    label.textContent = title;
    label.style.backgroundColor = bgColor;
  }
}

function removeBadge(): void {
  document.getElementById(BADGE_ID)?.remove();
  document.getElementById(BADGE_ID + '-label')?.remove();
}

// Ecouter les messages du background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'UPDATE_VIRTUAL_GROUP_BADGE') {
    if (message.group) {
      createOrUpdateBadge(message.group.title, message.group.color);
    } else {
      removeBadge();
    }
  }
});
