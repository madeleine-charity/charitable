# Charitable Mobile App

A React Native mobile app for donors to discover and support nonprofits through a social feed experience.

## Tech Stack

- **Expo** (managed workflow) - React Native framework
- **Expo Router** - File-based navigation
- **NativeWind** - Tailwind CSS for React Native
- **TanStack Query** - Data fetching and caching
- **Expo SecureStore** - Secure local storage

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. Expo CLI: `npm install -g expo-cli`
3. Expo Go app on your phone (for testing)

### Setup

1. Navigate to the mobile app directory:
   ```bash
   cd apps/mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the API URL:
   
   Create a `.env` file:
   ```
   EXPO_PUBLIC_API_URL=https://charitable3.vercel.app
   ```
   
   Replace with your deployed Charitable backend URL.

4. Start the development server:
   ```bash
   npx expo start
   ```

5. Scan the QR code with Expo Go (iOS/Android) to preview the app.

## Project Structure

```
apps/mobile/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Feed screen
│   │   ├── discover.tsx   # Browse nonprofits
│   │   └── profile.tsx    # User profile
│   ├── nonprofit/         # Dynamic routes
│   │   └── [slug].tsx     # Nonprofit detail
│   ├── donate.tsx         # Donation modal
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Reusable components
│   └── lib/              # API client, utilities
├── assets/               # Images, icons
└── package.json
```

## Screens

### Feed (Home Tab)
- Scrollable feed of fundraising posts
- Like/react to posts
- Quick donate buttons
- Pull-to-refresh

### Discover Tab
- Grid of nonprofit cards
- Browse by category
- Search nonprofits

### Nonprofit Detail
- Full nonprofit profile
- Fundraising campaigns
- Donate button
- Stats (total raised, donors)

### Profile Tab
- Guest mode by default
- Future: Sign in, donation history

### Donate (Modal)
- Preset donation amounts
- Custom amount input
- Opens Stripe Checkout

## Shared Code

This app uses `@charitable/shared` package for:
- TypeScript types (Nonprofit, Post, Donation, etc.)
- API client with React Query integration
- Zod validation schemas

## Building for Production

### Using EAS Build

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```

3. Configure the project:
   ```bash
   eas build:configure
   ```

4. Build for iOS:
   ```bash
   eas build --platform ios
   ```

5. Build for Android:
   ```bash
   eas build --platform android
   ```

## Deep Linking

The app is configured with the `charitable://` URL scheme for:
- Donation success callbacks
- Opening specific nonprofits

Configure universal links for production by following:
https://docs.expo.dev/guides/deep-linking/

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL |

## Notes

- The app shares the same backend as the web app
- Guest users get a unique ID stored securely on device
- Donations open Stripe Checkout in an in-app browser
