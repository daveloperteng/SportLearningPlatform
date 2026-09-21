# Sport Learning Platform

An accessible, multi-sport learning platform: volleyball is the first learning path, not the product boundary.

The first product slice is a guided, beginner-friendly Volleyball Foundations path. It has separate Kid and Parent presentations over the same learner record. The long-term platform supports age-appropriate experiences, adult learners, video evidence, coach feedback, and a future school PE/athletics edition.

## Current prototype

The app currently demonstrates a synthetic learner journey:

1. Kid Today
2. Platform Basics lesson
3. Practice plus reflection
4. Completion and effort coins
5. Shared Parent progress overview

The prototype uses in-memory state only. It does not include authentication, a database, real learner data, video uploads, coach feedback, or school access.

## Run locally

```bash
npm install
npx expo start
```

Press `w` to open the web app, or use Expo Go for an initial mobile preview.

## Checks

```bash
npx tsc --noEmit
npx expo export --platform web
```

## Project direction

The current architecture and staged implementation plan are documented in `docs/STATUS.md` and the project foundation document maintained with the project artifacts. The next implementation task is to extract the demo state into typed fixtures and a repository interface before adding persistence.
