import { z } from 'zod';

export const credentialsSchema = z.object({
  username: z.string().min(3).regex(/^[a-z0-9_.-]+$/i),
  password: z.string().min(4),
});

export const bodyLogSchema = z.object({
  weightKg: z.number().positive(),
  bodyFat: z.number().nonnegative().max(70).optional().nullable(),
});

export const maxesPatchSchema = z.object({
  maxes: z.array(z.object({
    exerciseId: z.string(),
    valueKg: z.number().nonnegative(),
  })).min(1),
});

export const workoutPostSchema = z.object({
  dayKey: z.enum(['push', 'pull', 'legs']),
  sets: z.array(z.object({
    exerciseId: z.string(),
    setIndex: z.number().int().nonnegative(),
    weightKg: z.number().nonnegative().nullable(),
    reps: z.number().int().nonnegative().nullable(),
    done: z.boolean(),
    isCore: z.boolean(),
  })),
});

export const onboardingSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  heightCm: z.number().min(100).max(250).optional(),
  age: z.number().int().min(10).max(120).optional(),
  goal: z.enum(['hypertrophy','strength','powerbuilding','recomp']).optional(),
  weightKg: z.number().min(30).max(300),
  maxes: z.array(z.object({ exerciseId: z.string(), valueKg: z.number().positive() })),
});

export const profilePatchSchema = z.object({
  name: z.string().min(1).max(50).nullable().optional(),
  heightCm: z.number().min(100).max(250).nullable().optional(),
  age: z.number().int().min(10).max(120).nullable().optional(),
  goal: z.enum(['hypertrophy','strength','powerbuilding','recomp']).nullable().optional(),
});
