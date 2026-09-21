# Build status

## Completed — 2026-09-21

- E00: no prior code repository or saved prototype was found in the workspace or project files.
- E01: Expo SDK 55 TypeScript / Expo Router project scaffolded locally.
- First interactive design slice: Kid Today → Platform Basics lesson → practice + reflection → completion / coins / Progress, with a Parent view of the same in-memory learner state.
- E02: typed learning domain fixtures and an in-memory `DemoLearningRepository` now drive the Kid and Parent views.
- E03: lesson content is data-driven; Platform Basics and Pass to Target are both playable in the demo.
- E04: completion feedback, tappable available path lessons, and a Parent reset control make the demo easier to review and replay.
- E05: initial Supabase migration and Row Level Security policies are prepared for adult accounts, learner profiles, lesson progress, and a server-managed rewards ledger.
- `npx tsc --noEmit` passes.
- `npx expo export --platform web` passes.

## Current limits

- This is a synthetic Maya demo. State resets on app reload.
- The Kid/Parent toggle is presentation only; it is not authentication or authorization.
- The demo-video card is a placeholder; no media is loaded.
- The Expo Supabase client is configured locally. Adult authentication and learner creation are in progress; lesson progress and rewards still use demo state.
- No child accounts, coach feedback, or deployment exists.
- `npm run lint` could not finish because Expo attempted to auto-download its initial ESLint configuration and the network request timed out.

## Next task

E06: finish verification of the adult sign-up/sign-in and learner creation flow. Child accounts, school roles, video, and coach feedback remain out of scope.
