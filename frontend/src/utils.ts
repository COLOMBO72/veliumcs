import type { CS2Stat } from './types';

export function getStat(stats: CS2Stat[] | null, name: string): number {
  if (!stats) return 0;
  return stats.find(s => s.name === name)?.value ?? 0;
}

export function eloToProgress(elo: number, level: number): number {
  const ranges: [number, number][] = [
    [0, 800], [801, 950], [951, 1100], [1101, 1250], [1251, 1400],
    [1401, 1550], [1551, 1700], [1701, 1850], [1851, 2000], [2001, 99999],
  ];
  const r = ranges[Math.min(level - 1, 9)];
  return Math.max(0, Math.min(100, ((elo - r[0]) / (r[1] - r[0])) * 100));
}

export function eloNextThreshold(level: number): number {
  const ranges = [800, 950, 1100, 1250, 1400, 1550, 1700, 1850, 2000, 99999];
  return ranges[Math.min(level, 9)];
}

export function levelColor(level: number): string {
  if (level <= 2) return '#8a8a8a';
  if (level <= 4) return '#1eff00';
  if (level <= 6) return '#00b4ff';
  if (level <= 8) return '#a855f7';
  return '#ff5500';
}

export function kdClass(kd: number): string {
  if (kd >= 1.5) return 'good';
  if (kd < 1) return 'danger';
  return '';
}
