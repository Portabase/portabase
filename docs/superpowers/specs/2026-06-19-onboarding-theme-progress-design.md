# Onboarding — Theme Persistence & Progress Bar Fix

**Date:** 2026-06-19  
**Scope:** `src/features/onboarding`  
**Status:** Approved

---

## Problem Statement

Two independent bugs in the onboarding flow:

1. **Theme not persisted to DB** — selecting a theme in `StepPreferences` applies it visually via `next-themes` but never calls `authClient.updateUser({ theme })`, so the preference is lost on page reload unless the user also saves an avatar.

2. **Progress bar starts from current step, not from the beginning** — `OnboardingStepper` uses `state.progressPercentage`, `state.currentStepNumber`, and `state.totalSteps` from OnboardJS. When onboarding resumes mid-flow (e.g. at step `invite-members`), OnboardJS recalculates these values relative to the remaining steps in the current session, not relative to the full 15-step flow. This makes the bar start at 0% even though the user is already 40%+ through.

---

## Fix 1 — Theme Persistence

**File:** `src/features/onboarding/steps/step-preferences.tsx`

### Current behaviour

```ts
const selectTheme = async (theme: ThemeKey) => {
  setTheme(theme);          // ✅ updates next-themes (UI)
  // mettre à jour aussi en db!  ← comment acknowledging the bug
  await updateContext({ ... });
};
```

### Target behaviour

```ts
const selectTheme = async (theme: ThemeKey) => {
  setTheme(theme);
  await authClient.updateUser({ theme });   // ← add this line
  await updateContext({ ... });
};
```

**Reference:** `src/features/profile/profile-appearance.tsx` already does this correctly.

**Error handling:** No change — if `updateUser` fails, the UI theme is still applied and the user can continue. No toast/error needed at this stage.

---

## Fix 2 — Progress Bar Recalculation

**File:** `src/features/onboarding/onboarding-stepper.tsx`

### Root cause

OnboardJS computes `progressPercentage` and `currentStepNumber` relative to the steps it was initialised with in the current session. When resuming mid-flow, the step list seen by OnboardJS starts at the resume step, not at `login`.

### Solution

Replace all OnboardJS progress values with a manual calculation based on `STEP_ORDER` (the canonical ordered list of all 15 steps, already defined in `src/features/onboarding/constants/steps.ts`).

```ts
import { STEP_ORDER } from "@/features/onboarding/constants/steps";

const currentId = String(state?.currentStep?.id ?? "");
const currentIndex = Math.max(0, STEP_ORDER.indexOf(currentId)); // guard: -1 → 0
const totalSteps = STEP_ORDER.length;                             // 15
const stepNumber = currentIndex + 1;                              // 1-based
const progress = Math.round((currentIndex / (totalSteps - 1)) * 100);
```

| Step             | Index | stepNumber | progress |
|------------------|-------|------------|----------|
| login            | 0     | 1 of 15    | 0%       |
| preferences      | 3     | 4 of 15    | 21%      |
| invite-members   | 5     | 6 of 15    | 36%      |
| storage          | 7     | 8 of 15    | 50%      |
| finish           | 14    | 15 of 15   | 100%     |

**Edge case:** If `currentId` is not found in `STEP_ORDER`, `indexOf` returns `-1`, clamped to `0` by `Math.max` → shows step 1 of 15 at 0%. Safe degradation.

---

## Files Changed

| File | Change |
|------|--------|
| `src/features/onboarding/steps/step-preferences.tsx` | Add `authClient.updateUser({ theme })` in `selectTheme` |
| `src/features/onboarding/onboarding-stepper.tsx` | Replace OnboardJS progress values with `STEP_ORDER`-based calculation |

No new files, no schema changes, no API changes.

---

## Out of Scope

- Adding a toast/error on failed theme save
- Persisting the avatar selection to DB during selection (only on "Continue" — existing behaviour unchanged)
- Refactoring OnboardJS step initialisation
