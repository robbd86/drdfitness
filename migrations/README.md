# Database Migration Required

## Change weight columns to support decimal values

After deploying these changes, you need to run this SQL migration on your Neon database:

```sql
-- Allow decimal weights like 17.5 kg instead of just integers
ALTER TABLE exercises ALTER COLUMN weight TYPE real;
ALTER TABLE workout_logs ALTER COLUMN weight TYPE real;
```

### How to run:

1. Go to your Neon console: https://console.neon.tech
2. Select your project
3. Go to SQL Editor
4. Paste the SQL above and click "Run"

Or use the Neon CLI:
```bash
neon sql-editor --project-id YOUR_PROJECT_ID
```

This will allow users to enter weights with decimal precision (e.g., 17.5 kg, 22.5 kg).
