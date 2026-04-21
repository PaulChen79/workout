import {
  pgTable, uuid, text, timestamp, numeric, integer, bigserial, bigint,
  boolean, smallint, primaryKey, index, check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable('profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name'),
  heightCm: numeric('height_cm', { precision: 5, scale: 1 }),
  age: integer('age'),
  goal: text('goal'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  goalCheck: check('goal_check', sql`${t.goal} IN ('hypertrophy','strength','powerbuilding','recomp')`),
}));

export const exerciseMaxes = pgTable('exercise_maxes', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  exerciseId: text('exercise_id').notNull(),
  valueKg: numeric('value_kg', { precision: 6, scale: 2 }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.exerciseId] }) }));

export const lastWeights = pgTable('last_weights', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  exerciseId: text('exercise_id').notNull(),
  valueKg: numeric('value_kg', { precision: 6, scale: 2 }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.exerciseId] }) }));

export const bodyLogs = pgTable('body_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
  weightKg: numeric('weight_kg', { precision: 5, scale: 2 }).notNull(),
  bodyFat: numeric('body_fat', { precision: 4, scale: 1 }),
}, (t) => ({ byUser: index('body_logs_user_logged_idx').on(t.userId, t.loggedAt.desc()) }));

export const workouts = pgTable('workouts', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  dayKey: text('day_key').notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }).notNull().defaultNow(),
  doneCount: integer('done_count').notNull(),
  totalVolume: numeric('total_volume', { precision: 10, scale: 2 }).notNull(),
  prCount: integer('pr_count').notNull().default(0),
}, (t) => ({
  dayCheck: check('day_key_check', sql`${t.dayKey} IN ('push','pull','legs')`),
  byUser: index('workouts_user_finished_idx').on(t.userId, t.finishedAt.desc()),
}));

export const workoutSets = pgTable('workout_sets', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  workoutId: bigint('workout_id', { mode: 'number' }).references(() => workouts.id, { onDelete: 'cascade' }).notNull(),
  exerciseId: text('exercise_id').notNull(),
  setIndex: integer('set_index').notNull(),
  weightKg: numeric('weight_kg', { precision: 6, scale: 2 }),
  reps: integer('reps'),
  done: boolean('done').notNull().default(false),
  isCore: boolean('is_core').notNull().default(false),
});

export const exerciseFeedback = pgTable('exercise_feedback', {
  workoutId: bigint('workout_id', { mode: 'number' }).references(() => workouts.id, { onDelete: 'cascade' }).notNull(),
  exerciseId: text('exercise_id').notNull(),
  rir: smallint('rir'),
}, (t) => ({
  pk: primaryKey({ columns: [t.workoutId, t.exerciseId] }),
  rirCheck: check('rir_range', sql`${t.rir} BETWEEN 0 AND 5`),
}));

export const userProgressionState = pgTable('user_progression_state', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  exerciseId: text('exercise_id').notNull(),
  scheme: text('scheme').notNull(),
  currentPct: numeric('current_pct', { precision: 4, scale: 3 }).notNull(),
  streak: integer('streak').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.exerciseId, t.scheme] }) }));
