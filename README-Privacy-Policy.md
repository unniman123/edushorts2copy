# Privacy Policy Hosting Instructions

## Quick Setup for Google Play Store

To resolve the camera permission privacy policy requirement, follow these steps:

### Option 1: GitHub Pages (Recommended - Free)

1. **Create a new repository** (or use existing one):
   ```bash
   git init privacy-policy
   cd privacy-policy
   ```

2. **Copy the privacy policy file**:
   ```bash
   cp public/privacy-policy.html index.html
   ```

3. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add privacy policy"
   git push origin main
   ```

4. **Enable GitHub Pages**:
   - Go to your repository settings
   - Scroll to "Pages" section
   - Select "Deploy from a branch"
   - Choose "main" branch
   - Your privacy policy will be available at: `https://yourusername.github.io/privacy-policy/`

### Option 2: Simple Hosting Services

1. **Netlify**: Drop the `privacy-policy.html` file on [netlify.com/drop](https://netlify.com/drop)
2. **Vercel**: Upload via [vercel.com](https://vercel.com)
3. **Surge.sh**: Use command line tool for instant deployment

### Option 3: Your Own Domain

If you have a website, simply upload `privacy-policy.html` to:
- `https://yourdomain.com/privacy-policy.html`

## Google Play Console Setup

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your "Edushorts" app
3. Navigate to **Policy** > **App content**
4. Find **Privacy Policy** section
5. Enter your privacy policy URL (from step above)
6. Save changes

## Example URLs

After hosting, your privacy policy URL might look like:
- `https://yourusername.github.io/privacy-policy/`
- `https://edushorts-privacy.netlify.app/`
- `https://yourdomain.com/privacy-policy.html`

## Important Notes

- The privacy policy specifically addresses camera permissions required by `expo-image-picker`
- With R8 optimizer now enabled, the camera permission may be stripped out automatically
- The privacy policy covers your bases for both scenarios
- You can update the contact email in the privacy policy to your actual support email

## Next Steps

1. Host the privacy policy using one of the options above
2. Add the URL to Google Play Console
3. Run a new production build: `eas build --platform android --profile production`
4. Upload the new AAB to Google Play Store 