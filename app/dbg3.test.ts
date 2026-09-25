import { it } from 'vitest';
it('debug glob2', () => {
  const a = import.meta.glob('../data/csur-pro/CSUR-PRO-*.json', { eager: true });
  console.log('keys:', Object.keys(a).length);
  const vals = Object.values(a) as any[];
  console.log('first is array:', Array.isArray(vals[0]?.default ?? vals[0]));
  console.log('first len:', (vals[0]?.default ?? vals[0])?.length);
});
