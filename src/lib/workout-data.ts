export type Category = 'push' | 'pull' | 'legs' | 'core';
export type SchemeId = 'strength' | 'power' | 'hypertrophy' | 'pump';

export interface Exercise {
  name: string;
  cat: Category;
  role: 'primary' | 'secondary' | 'isolation';
  equip: 'barbell' | 'dumbbell' | 'machine' | 'bodyweight' | 'cable';
  trackable: boolean;
  muscles: string[];
  timed?: boolean;
}

export interface Scheme {
  name: string;
  pctLow: number;
  pctHigh: number;
  repLow: number;
  repHigh: number;
  rest: number;
  rir: [number, number];
  note: string;
}

export const EXERCISES: Record<string, Exercise> = {
  // PUSH
  bench_press:       { name: '槓鈴臥推', cat: 'push', role: 'primary', equip: 'barbell', trackable: true, muscles: ['胸','三頭','前三角'] },
  incline_bench:     { name: '上斜臥推', cat: 'push', role: 'secondary', equip: 'barbell', trackable: false, muscles: ['上胸','前三角'] },
  dumbbell_press:    { name: '啞鈴臥推', cat: 'push', role: 'secondary', equip: 'dumbbell', trackable: false, muscles: ['胸','三頭'] },
  ohp:               { name: '槓鈴肩推 (OHP)', cat: 'push', role: 'primary', equip: 'barbell', trackable: true, muscles: ['三角','三頭'] },
  dumbbell_shoulder_press: { name: '啞鈴肩推', cat: 'push', role: 'secondary', equip: 'dumbbell', trackable: false, muscles: ['三角','三頭'] },
  lateral_raise:     { name: '啞鈴側平舉', cat: 'push', role: 'isolation', equip: 'dumbbell', trackable: false, muscles: ['中三角'] },
  tricep_pushdown:   { name: '三頭下壓', cat: 'push', role: 'isolation', equip: 'cable', trackable: false, muscles: ['三頭'] },
  overhead_tricep:   { name: '啞鈴過頂三頭伸展', cat: 'push', role: 'isolation', equip: 'dumbbell', trackable: false, muscles: ['三頭長頭'] },
  dips:              { name: '雙槓臂屈伸', cat: 'push', role: 'secondary', equip: 'bodyweight', trackable: false, muscles: ['胸下','三頭'] },
  // PULL
  deadlift:          { name: '傳統硬舉', cat: 'pull', role: 'primary', equip: 'barbell', trackable: true, muscles: ['背','臀','腿後'] },
  barbell_row:       { name: '槓鈴划船', cat: 'pull', role: 'primary', equip: 'barbell', trackable: true, muscles: ['背闊','中背','後三角'] },
  pullup:            { name: '引體向上', cat: 'pull', role: 'primary', equip: 'bodyweight', trackable: true, muscles: ['背闊','二頭'] },
  lat_pulldown:      { name: '滑輪下拉', cat: 'pull', role: 'secondary', equip: 'machine', trackable: false, muscles: ['背闊','二頭'] },
  seated_row:        { name: '坐姿划船', cat: 'pull', role: 'secondary', equip: 'machine', trackable: false, muscles: ['中背','背闊'] },
  dumbbell_row:      { name: '單臂啞鈴划船', cat: 'pull', role: 'secondary', equip: 'dumbbell', trackable: false, muscles: ['背闊','中背'] },
  face_pull:         { name: '繩索臉拉', cat: 'pull', role: 'isolation', equip: 'cable', trackable: false, muscles: ['後三角','旋轉肌群'] },
  barbell_curl:      { name: '槓鈴彎舉', cat: 'pull', role: 'isolation', equip: 'barbell', trackable: true, muscles: ['二頭'] },
  hammer_curl:       { name: '錘式彎舉', cat: 'pull', role: 'isolation', equip: 'dumbbell', trackable: false, muscles: ['二頭','肱肌'] },
  // LEGS
  back_squat:        { name: '背蹲舉', cat: 'legs', role: 'primary', equip: 'barbell', trackable: true, muscles: ['股四','臀','核心'] },
  front_squat:       { name: '前蹲舉', cat: 'legs', role: 'secondary', equip: 'barbell', trackable: false, muscles: ['股四','核心'] },
  rdl:               { name: '羅馬尼亞硬舉 (RDL)', cat: 'legs', role: 'primary', equip: 'barbell', trackable: true, muscles: ['腿後','臀'] },
  leg_press:         { name: '腿推機', cat: 'legs', role: 'secondary', equip: 'machine', trackable: false, muscles: ['股四','臀'] },
  bulgarian_split:   { name: '保加利亞分腿蹲', cat: 'legs', role: 'secondary', equip: 'dumbbell', trackable: false, muscles: ['股四','臀'] },
  leg_curl:          { name: '腿彎舉', cat: 'legs', role: 'isolation', equip: 'machine', trackable: false, muscles: ['腿後'] },
  leg_extension:     { name: '腿伸展', cat: 'legs', role: 'isolation', equip: 'machine', trackable: false, muscles: ['股四'] },
  calf_raise:        { name: '站姿提踵', cat: 'legs', role: 'isolation', equip: 'machine', trackable: false, muscles: ['小腿'] },
  hip_thrust:        { name: '臀推', cat: 'legs', role: 'secondary', equip: 'barbell', trackable: false, muscles: ['臀'] },
  // CORE
  plank:             { name: '棒式', cat: 'core', role: 'isolation', equip: 'bodyweight', trackable: false, muscles: ['腹橫肌','核心'], timed: true },
  hanging_leg_raise: { name: '懸吊舉腿', cat: 'core', role: 'isolation', equip: 'bodyweight', trackable: false, muscles: ['下腹'] },
  cable_crunch:      { name: '繩索捲腹', cat: 'core', role: 'isolation', equip: 'cable', trackable: false, muscles: ['腹直肌'] },
  russian_twist:     { name: '俄式扭轉', cat: 'core', role: 'isolation', equip: 'dumbbell', trackable: false, muscles: ['腹斜肌'] },
  ab_wheel:          { name: '腹肌滾輪', cat: 'core', role: 'isolation', equip: 'bodyweight', trackable: false, muscles: ['核心全部'] },
  pallof_press:      { name: 'Pallof 推', cat: 'core', role: 'isolation', equip: 'cable', trackable: false, muscles: ['抗旋核心'] },
};

export const SCHEMES: Record<SchemeId, Scheme> = {
  strength:    { name: '力量',   pctLow: 0.80, pctHigh: 0.85, repLow: 3, repHigh: 5,  rest: 180, rir: [1,2], note: '主項力量 — 重、慢、留 1 下' },
  power:       { name: '動力',   pctLow: 0.72, pctHigh: 0.78, repLow: 5, repHigh: 7,  rest: 150, rir: [1,2], note: '次主項 — 中高強度' },
  hypertrophy: { name: '增肌',   pctLow: 0.65, pctHigh: 0.75, repLow: 8, repHigh: 10, rest: 90,  rir: [2,3], note: '肌肥大黃金區間 8-10 下' },
  pump:        { name: '泵感',   pctLow: 0.50, pctHigh: 0.60, repLow: 12, repHigh: 15, rest: 60, rir: [0,2], note: '代謝壓力 — 短休、衝 15 下' },
};

export type DayKey = 'push' | 'pull' | 'legs';

export interface Slot { id: string; sets: number; scheme: SchemeId; }

export interface DayTemplate { label: string; subtitle: string; slots: Slot[]; core: string[]; }

export const DAY_TEMPLATES: Record<DayKey, DayTemplate> = {
  push: {
    label: 'Push Day', subtitle: '胸 · 肩 · 三頭',
    slots: [
      { id: 'bench_press',     sets: 4, scheme: 'strength' },
      { id: 'ohp',             sets: 4, scheme: 'power' },
      { id: 'incline_bench',   sets: 3, scheme: 'hypertrophy' },
      { id: 'lateral_raise',   sets: 3, scheme: 'pump' },
      { id: 'tricep_pushdown', sets: 3, scheme: 'pump' },
    ],
    core: ['hanging_leg_raise', 'pallof_press'],
  },
  pull: {
    label: 'Pull Day', subtitle: '背 · 二頭 · 後三角',
    slots: [
      { id: 'deadlift',     sets: 3, scheme: 'strength' },
      { id: 'pullup',       sets: 4, scheme: 'power' },
      { id: 'barbell_row',  sets: 3, scheme: 'hypertrophy' },
      { id: 'face_pull',    sets: 3, scheme: 'pump' },
      { id: 'barbell_curl', sets: 3, scheme: 'hypertrophy' },
    ],
    core: ['ab_wheel', 'russian_twist'],
  },
  legs: {
    label: 'Legs Day', subtitle: '股四 · 腿後 · 臀 · 小腿',
    slots: [
      { id: 'back_squat',      sets: 4, scheme: 'strength' },
      { id: 'rdl',             sets: 3, scheme: 'power' },
      { id: 'bulgarian_split', sets: 3, scheme: 'hypertrophy' },
      { id: 'leg_curl',        sets: 3, scheme: 'pump' },
      { id: 'calf_raise',      sets: 4, scheme: 'pump' },
    ],
    core: ['plank', 'cable_crunch'],
  },
};
