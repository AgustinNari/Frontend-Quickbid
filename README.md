# QuickBid — Mobile App

Mobile auction application developed as a team project using React Native and TypeScript.

QuickBid includes registration and authentication, auction browsing, real-time bidding, purchases, payment methods, consignments, user profiles, and notifications.

The backend is available in [quickbid-backend](https://github.com/AgustinNari/quickbid-backend).

## Features

- User registration and authentication
- Auction and catalog browsing
- Real-time bidding through WebSocket/STOMP
- Purchases and payment-method management
- Product consignments
- User profile management
- Notifications
- Connectivity detection
- Offline consignment drafts stored locally
- Authentication deep links

Operations that require server confirmation, including live bidding, require an active connection.

## Tech Stack

- React Native 0.85
- React 19
- TypeScript
- React Navigation
- AsyncStorage
- WebSocket / STOMP
- Android
- iOS

## Requirements

### General

- Node.js 22.11 or newer
- npm

### Android

- JDK 17
- Android Studio
- Android SDK 36
- NDK 27.1.12297006
- Android API 24 or newer

### iOS

- macOS
- Xcode
- Ruby / Bundler
- CocoaPods

## Installation

```bash
cd FrontendQuickbid
npm ci
```

For iOS:

```bash
bundle install
cd ios
bundle exec pod install
```

Then return to `FrontendQuickbid/`.

## Backend Configuration

API configuration is located in:

```text
FrontendQuickbid/src/api/config.ts
```

The application currently supports three connection modes:

| Mode | Backend |
| --- | --- |
| `public` | Configured public demo backend |
| `localReverse` | `http://localhost:8080` using ADB reverse |
| `emulator` | `http://10.0.2.2:8080` for the Android emulator |

The WebSocket URL is derived from the HTTP/HTTPS backend URL.

The backend should use:

```text
quickbid://auth
```

as the frontend base URL for registration and password-recovery links.

## Running the App

Start Metro:

```bash
npm start
```

Then, in another terminal:

```bash
npm run android
```

or on macOS:

```bash
npm run ios
```

For Android with a local backend:

```bash
npm run android:local
```

For the public backend:

```bash
npm run android:public
```

## Validation

Run Jest tests:

```bash
npm test -- --runInBand
```

Run lint:

```bash
npm run lint
```

Run TypeScript validation:

```bash
npx --no-install tsc --noEmit
```

Tests cover components, connectivity behavior, data mapping, payment methods, documents, and consignment drafts.

## Demo Scope

The configured public URL points to a demonstration backend and its availability depends on that service.

Payments and demo data follow the behavior implemented by the backend.

Android currently uses a debug signing configuration for release builds, so the repository should not be considered a production distribution configuration.
