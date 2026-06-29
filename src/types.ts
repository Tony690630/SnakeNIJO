export type ControlMode = 'buttons' | 'swipe' | 'joystick';

export interface Difficulty {
  speed: number;
  scoreValue: number;
  label: string;
}

export interface Position {
  x: number;
  y: number;
}

export const DIFFICULTY_SETTINGS: Record<number, Difficulty> = {
  1: { speed: 450, scoreValue: 10, label: "等級 1 (慢速)" },
  2: { speed: 380, scoreValue: 20, label: "等級 2 (輕鬆)" },
  3: { speed: 300, scoreValue: 30, label: "等級 3 (標準)" },
  4: { speed: 220, scoreValue: 40, label: "等級 4 (快速)" },
  5: { speed: 150, scoreValue: 50, label: "等級 5 (極速)" }
};
