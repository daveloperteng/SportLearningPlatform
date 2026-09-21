# Supabase setup

The first persistence boundary is deliberately small: adult accounts own learner profiles and can read or update their own learners' lesson progress. There are no child accounts, school records, coach access, video uploads, or payment data yet.

## Apply the migration

1. Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/hhixzwsriirfwqlzxshp/sql/new).
2. Open `supabase/migrations/20260921110000_initial_learning_foundation.sql` from this repository.
3. Paste the complete file into a new query and select **Run**.
4. Confirm that the five tables appear in **Database → Tables**.

## Configure the app locally

1. In the project Dashboard, open **Connect**, then copy the project URL and **publishable** key.
2. Copy `.env.example` to `.env`.
3. Replace `sb_publishable_replace_me` with the publishable key.

`.env` is ignored by Git. Do not use or share a secret key or a legacy `service_role` key in the app.

## What comes next

Install the Expo-compatible Supabase client, wire up the client using the two public environment variables, then add adult email sign-up/sign-in and learner creation. The UI will continue to use the demo repository until that flow is ready.
