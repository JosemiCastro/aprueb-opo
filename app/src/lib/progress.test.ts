import { describe, expect, it } from 'vitest';
import {
  emptyProgress,
  failedIds,
  grade,
  isDominated,
  masteryPct,
  recordAnswer,
  recordSession,
  setCheck,
  streakDays,
} from './progress';

describe('progress', () => {
  it('emptyProgress devuelve el estado inicial', () => {
    expect(emptyProgress()).toEqual({ qa: {}, sessions: [], checks: {} });
  });

  it('recordAnswer es inmutable y acumula ok/ko', () => {
    const p0 = emptyProgress();
    const p1 = recordAnswer(p0, 'q1', true);
    expect(p0.qa['q1']).toBeUndefined();
    expect(p1.qa['q1']?.ok).toBe(1);
    expect(p1.qa['q1']?.ko).toBe(0);
    expect(p1.qa['q1']?.last).toEqual(expect.any(Number));
    const p2 = recordAnswer(p1, 'q1', false);
    expect(p1.qa['q1']?.ko).toBe(0);
    expect(p2.qa['q1']).toMatchObject({ ok: 1, ko: 1 });
  });

  it('recordSession añade sin mutar', () => {
    const p0 = emptyProgress();
    const s = { date: '2026-09-19', perfil: 'c1' as const, modo: 'test' as const, total: 10, aciertos: 7 };
    const p1 = recordSession(p0, s);
    expect(p0.sessions).toHaveLength(0);
    expect(p1.sessions).toHaveLength(1);
  });

  it('setCheck marca items del checklist sin mutar', () => {
    const p0 = emptyProgress();
    const p1 = setCheck(p0, 'HUE-A2-E01', 2, true);
    expect(p0.checks['HUE-A2-E01']).toBeUndefined();
    expect(p1.checks['HUE-A2-E01']).toEqual([undefined, undefined, true]);
  });

  it('masteryPct cuenta preguntas con algún intento', () => {
    let p = emptyProgress();
    p = recordAnswer(p, 'q1', true);
    p = recordAnswer(p, 'q2', false);
    expect(masteryPct(p, ['q1', 'q2', 'q3'])).toEqual({ pct: 67, done: 2, total: 3 });
    expect(masteryPct(p, [])).toEqual({ pct: 0, done: 0, total: 0 });
  });

  it('isDominated exige ok>=2 y ok>ko', () => {
    let p = emptyProgress();
    p = recordAnswer(p, 'q1', true);
    expect(isDominated(p, 'q1')).toBe(false);
    p = recordAnswer(p, 'q1', true);
    expect(isDominated(p, 'q1')).toBe(true);
    p = recordAnswer(p, 'q1', false);
    p = recordAnswer(p, 'q1', false);
    expect(isDominated(p, 'q1')).toBe(false); // ok=2, ko=2
    expect(isDominated(p, 'nope')).toBe(false);
  });

  it('failedIds devuelve fallos no dominados', () => {
    let p = emptyProgress();
    p = recordAnswer(p, 'q1', false);
    p = recordAnswer(p, 'q2', true);
    p = recordAnswer(p, 'q2', true);
    p = recordAnswer(p, 'q2', false); // ko>0 pero dominada (ok=2 > ko=1)
    expect(failedIds(p)).toEqual(['q1']);
  });

  it('grade calcula la nota sobre 10 con 1 decimal', () => {
    expect(grade(7, 10)).toBe(7);
    expect(grade(1, 3)).toBe(3.3);
    expect(grade(0, 0)).toBe(0);
  });

  it('streakDays cuenta días consecutivos hacia atrás desde hoy', () => {
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const today = new Date();
    const mk = (offset: number) => ({
      date: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)),
      perfil: 'c1' as const,
      modo: 'test' as const,
      total: 5,
      aciertos: 4,
    });
    let p = emptyProgress();
    p = recordSession(p, mk(0));
    p = recordSession(p, mk(1));
    p = recordSession(p, mk(3)); // hueco el día 2
    expect(streakDays(p)).toBe(2);
    expect(streakDays(emptyProgress())).toBe(0);
  });
});
