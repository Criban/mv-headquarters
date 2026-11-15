export interface WeaponStats { weaponName: string; kills: number; image: string | null; }

export function topWeapons(value: unknown): WeaponStats[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((weapon: unknown): WeaponStats[] => {
    if (!weapon || typeof weapon !== 'object') return [];
    const { weaponName, kills, altImage } = weapon as Record<string, unknown>;
    const count = typeof kills === 'number' ? kills
      : typeof kills === 'string' && kills.trim() ? Number(kills) : NaN;
    if (typeof weaponName !== 'string' || !weaponName.trim() || !Number.isFinite(count) || count < 0) return [];
    const image = typeof altImage === 'string' && /^https:\/\/cdn\.gametools\.network\/weapons\/bf6\/white\/[a-zA-Z0-9_.-]+\.(?:webp|png)$/i.test(altImage) ? altImage : null;
    return [{ weaponName: weaponName.trim(), kills: count, image }];
  }).sort((a, b) => b.kills - a.kills || a.weaponName.localeCompare(b.weaponName)).slice(0, 3);
}
