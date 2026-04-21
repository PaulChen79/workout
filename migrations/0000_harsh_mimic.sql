CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "body_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"weight_kg" numeric(5, 2) NOT NULL,
	"body_fat" numeric(4, 1)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exercise_feedback" (
	"workout_id" bigint NOT NULL,
	"exercise_id" text NOT NULL,
	"rir" smallint,
	CONSTRAINT "exercise_feedback_workout_id_exercise_id_pk" PRIMARY KEY("workout_id","exercise_id"),
	CONSTRAINT "rir_range" CHECK ("exercise_feedback"."rir" BETWEEN 0 AND 5)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exercise_maxes" (
	"user_id" uuid NOT NULL,
	"exercise_id" text NOT NULL,
	"value_kg" numeric(6, 2) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_maxes_user_id_exercise_id_pk" PRIMARY KEY("user_id","exercise_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "last_weights" (
	"user_id" uuid NOT NULL,
	"exercise_id" text NOT NULL,
	"value_kg" numeric(6, 2) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "last_weights_user_id_exercise_id_pk" PRIMARY KEY("user_id","exercise_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"height_cm" numeric(5, 1),
	"age" integer,
	"goal" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goal_check" CHECK ("profiles"."goal" IN ('hypertrophy','strength','powerbuilding','recomp'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_progression_state" (
	"user_id" uuid NOT NULL,
	"exercise_id" text NOT NULL,
	"scheme" text NOT NULL,
	"current_pct" numeric(4, 3) NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_progression_state_user_id_exercise_id_scheme_pk" PRIMARY KEY("user_id","exercise_id","scheme")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workout_sets" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"workout_id" bigint NOT NULL,
	"exercise_id" text NOT NULL,
	"set_index" integer NOT NULL,
	"weight_kg" numeric(6, 2),
	"reps" integer,
	"done" boolean DEFAULT false NOT NULL,
	"is_core" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workouts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"day_key" text NOT NULL,
	"finished_at" timestamp with time zone DEFAULT now() NOT NULL,
	"done_count" integer NOT NULL,
	"total_volume" numeric(10, 2) NOT NULL,
	"pr_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "day_key_check" CHECK ("workouts"."day_key" IN ('push','pull','legs'))
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "body_logs" ADD CONSTRAINT "body_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercise_feedback" ADD CONSTRAINT "exercise_feedback_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercise_maxes" ADD CONSTRAINT "exercise_maxes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "last_weights" ADD CONSTRAINT "last_weights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_progression_state" ADD CONSTRAINT "user_progression_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "body_logs_user_logged_idx" ON "body_logs" USING btree ("user_id","logged_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workouts_user_finished_idx" ON "workouts" USING btree ("user_id","finished_at" DESC NULLS LAST);