-- Migration: Change weight columns from integer to real (float) to support decimal values like 17.5 kg
-- This allows users to enter weights with decimal precision

-- Update exercises table
ALTER TABLE exercises ALTER COLUMN weight TYPE real;

-- Update workout_logs table  
ALTER TABLE workout_logs ALTER COLUMN weight TYPE real;
