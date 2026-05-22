# /check-env

Verify the project environment is correctly configured.

## What to do

1. Read `CLAUDE.md` for the list of required environment variables.
2. Check that a `.env` file exists (do not read its contents aloud).
3. Confirm every variable listed in `CLAUDE.md` is present in `.env` (key names only — no values).
4. Report any missing keys and explain what each one is used for.
5. If `.env` is missing entirely, generate a `.env.example` with all required keys and empty values.
