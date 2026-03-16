

## Fix: Trip form should open on step 1 by default

### Problem
In `src/components/TripForm.tsx` line 94, `currentStep` defaults to `0` via `formState.currentStep ?? 0`. Since steps are 1-4, step 0 shows the stepper header but no step content — the user must click a step circle to begin.

### Fix
Change the fallback on line 94 from `?? 0` to `?? 1`, and similarly on line 97 where the callback form also defaults to `0`. This ensures the form always opens on step 1 (Viaje).

### File
`src/components/TripForm.tsx` — lines 94 and 97: replace `?? 0` with `?? 1`.

