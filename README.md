# LokalAuth - React Native Assignment

Passwordless authentication flow using Email + OTP, followed by a Session screen with live duration tracking.

## Tech Stack

- React Native (Expo)
- TypeScript
- Functional components and React hooks
- AsyncStorage (external SDK)

## Setup and Run

### Prerequisites

- Node.js 18+
- Expo Go app (Android/iOS) or emulator

### Commands

```bash
git clone <repo-url>
cd LokalAuth
npm install
npx expo start
```

### Open the app

- Mobile: scan the QR code with Expo Go
- Android emulator: press `a` in terminal
- iOS simulator (macOS): press `i`

## Requirement Coverage

- Email input and validation
- Local 6-digit OTP generation
- OTP stored per email
- OTP expiry in 60 seconds
- Max 3 OTP attempts
- Resend OTP invalidates old OTP and resets attempts/timer
- Session screen with:
  - session start time
  - live duration in `mm:ss`
  - logout
- Required event logging:
  - `otp_generated`
  - `otp_validation_success`
  - `otp_validation_failure`
  - `user_logout`

## OTP Logic and Expiry Handling

Implemented in `src/services/otpManager.ts`.

Rules:

- OTP length: 6 digits
- OTP expiry: 60 seconds
- Max attempts: 3
- OTP scope: per normalized email key

Validation sequence:

1. Check OTP record exists for email
2. Check OTP is not expired
3. Check attempts have not exceeded max
4. Check OTP value

On success, OTP record is deleted for that email.

## Data Structures Used and Why

OTP storage uses:

- `Record<string, OtpRecord>`
- Key: normalized email
- Value: `{ otp, email, attempts, expiresAt }`

Why:

- O(1) lookup by email
- clear per-email isolation
- easy overwrite on resend
- persisted through AsyncStorage, avoiding global mutable runtime state

## External SDK Chosen and Why

SDK: `@react-native-async-storage/async-storage`

Why this SDK:

- valid and allowed by assignment
- works with Expo without backend or cloud setup
- suitable for local event logging and session persistence

Used in:

- `src/services/analytics.ts` for event logs and persisted session data
- `src/services/otpManager.ts` for persisted per-email OTP store

## Timer Correctness

Implemented in `src/hooks/useSessionTimer.ts`.

- computes elapsed using `Date.now() - startTime`
- does not reset on re-render
- cleans interval on unmount
- supports explicit stop on logout
- remains correct after app background/foreground transitions

## Edge Cases Handled

- expired OTP
- incorrect OTP
- max attempts exceeded
- resend resets state (OTP, attempts, timer)
- session timer stays correct after background/foreground

## Architecture

Separation of concerns:

- UI: `src/screens/*`
- Business logic: `src/services/otpManager.ts`
- Side effects and persistence: `src/services/analytics.ts`
- Reusable timer behavior: `src/hooks/useSessionTimer.ts`
- Types: `src/types/*`

## Tooling Assistance and Implementation Ownership

Tooling (GPT/docs) was used for:

- initial project scaffolding guidance
- layout/style cleanup ideas
- README organization

Core implementation completed and validated in project code:

- OTP business rules and validation order
- per-email OTP storage design
- session timer lifecycle and cleanup behavior
- analytics event integration and logout/session reset flow

## Optional Bonus Implemented

- visual OTP countdown timer
- custom session hook (`useSessionTimer`)
- session persistence using AsyncStorage

## Project Structure

```text
src/
  screens/
    LoginScreen.tsx
    OtpScreen.tsx
    SessionScreen.tsx
  hooks/
    useSessionTimer.ts
  services/
    otpManager.ts
    analytics.ts
  navigation/
    AppNavigator.tsx
  types/
    auth.ts
    navigation.ts
```
