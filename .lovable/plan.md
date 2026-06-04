## Updated placement

Move the **Download App** entry point off the homepage and put it on the **Sign In page** (`/login`) so users can grab the APK before they even have an account.

## What I'll build

### 1. Capacitor setup (so an APK can exist)
- Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`
- Add `capacitor.config.ts` (appId `app.lovable.entrevault`, appName `EntreVault`)
- Set Vite `base: './'` for Capacitor compatibility

### 2. Admin-managed APK URL + version
- New columns on `admin_settings`: `apk_download_url`, `apk_version`
- Expose them via `get_public_settings()`
- New **Admin → Settings → "Mobile App"** section:
  - Upload `.apk` to a new public `app-releases` Supabase Storage bucket, **or** paste an external URL
  - Version field (e.g. `1.0.0`)

### 3. Download button on the Sign In page
- Add a **"Download Android App · v1.0.0"** button on `/login` (and `/register` for symmetry), styled with the emerald primary
- Behavior:
  - **Android phone** → direct `.apk` download
  - **iPhone** → modal: "iOS doesn't allow APKs — tap Share → Add to Home Screen to install"
  - **Desktop** → modal with a QR code of the APK URL to scan with phone
- Hidden if admin hasn't configured an APK URL yet
- Small "Available for Android" helper text under the button

### 4. PWA manifest (so iOS users get a real install option)
- `manifest.webmanifest`, theme color, apple-touch-icon, standalone display
- No service worker (avoids cache issues)

### 5. Homepage stays clean
- No download button on `/` — only the sign-in / register pages

## What you do once locally to produce the APK

```
git pull && npm install
npx cap add android
npm run build && npx cap sync
npx cap open android      # Android Studio → Build → Build APK
```
Then upload the `app-release.apk` in **Admin → Settings → Mobile App**. Done — every visitor sees the button working on the sign-in page.

## Files touched

- `package.json`, `capacitor.config.ts` (new), `vite.config.ts`
- `index.html` + `public/manifest.webmanifest` + icons
- `supabase/migrations/...` (columns + `app-releases` bucket + policies)
- `src/pages/admin/AdminSettingsPage.tsx` (Mobile App section + APK upload)
- `src/components/DownloadAppButton.tsx` (new — handles Android/iOS/desktop logic + QR modal)
- `src/pages/LoginPage.tsx` + `src/pages/RegisterPage.tsx` (mount the button)

Confirm and I'll build it.