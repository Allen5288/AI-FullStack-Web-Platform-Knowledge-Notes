## Backgroud:

Deep Link WorkFlow Diagram:
![Deep Link WorkFlow Diagram](./assets/DeepLink.svg)

The fundamental problem it solves is that **links (URLs) are native to the web, not to mobile apps**. When you click a web link, a browser opens, and everything just works. 

Deep link that could solve these problems:

1. **Platform Detection:** The link is smart enough to know if it's being clicked on an iOS device, an Android device, or a desktop computer.
2. **App Detection:** It checks if the user already has your app installed.
3. **Routing Logic:**
    - If the app **is installed**, the link seamlessly opens the app and takes the user to the specific content (e.g., the invited friend's profile, a specific product). This is **basic deep linking**.
    - If the app **is not installed**, it redirects the user to the correct App Store or Google Play Store page.
4. **Contextual Information & Attribution (The "Magic"):** This is the most critical part. After the user installs and opens the app for the first time, Deep Linking ensures that the original context (the `token` from your invite link) is passed into the app. This is called **deferred deep linking**. This allows you to know *who* invited this new user and correctly attribute the install.

you have two types of routes:

1. **Explicit Routes:** For files that physically exist in the `assets` folder.
2. **Catch-All Route:** For literally any other URL path, which all get routed to `fallback.html`.

## StaticSite For CloudFront Static Web

`StaticSite` not as a single resource, but as a **high-level pattern** or a "recipe" for the common task of hosting a static website on AWS. 

- `new sst.aws.StaticSite("DeepLinkSite", { ... });`
- You are telling SST, "I want a modern, fast, and secure static website. Please go and build all the necessary underlying AWS infrastructure for me according to best practices.”
- this "recipe" **always includes**:
    1. **An S3 Bucket:** This is the foundational piece. SST creates a new, private S3 bucket that will serve as the storage for your website's files. It's the "hard drive" for your site.
    2. **A CloudFront Distribution (CDN):** SST knows that serving files directly from S3 is slow and inefficient. So, it automatically creates a global CloudFront Content Delivery Network and configures it to point to your S3 bucket. This is what makes your site fast for users anywhere in the world.
    3. **An Origin Access Identity (OAI):** This is a security feature. SST configures CloudFront to access the S3 bucket using this special identity, which allows you to keep your S3 bucket private from the public internet. Users can *only* access your files through the fast and secure CloudFront CDN.
    4. **Deployment Logic:** When you run `sst deploy`, SST's logic automatically zips up the contents of the folder you specified in the `path` property (i.e., your `assets` folder) and uploads it to the S3 bucket it created. It also intelligently invalidates the CloudFront cache so users see the new files immediately.

## CloudFront setup:

1. **A User Clicks Your Link:** A user, who already has your app installed, clicks `https://links.your-app-domain.com/invite/xyz123`.
2. **The OS Intercepts the Click:** Before opening a web browser, both iOS and Android pause for a millisecond. They see the domain (`links.your-app-domain.com`) and ask themselves, "Do I have any installed apps that claim to be associated with this domain?"
3. **The OS Checks for Proof (The "Handshake"):**
    - **On iOS:** The operating system makes a secure web request to `https://links.your-app-domain.com/.well-known/apple-app-site-association`.
    - **On Android:** The operating system makes a similar request to `https://links.your-app-domain.com/.well-known/assetlinks.json`.
4. **CloudFront Serves the File:** Your CloudFront distribution receives this request. Because this is a "normal route" (the file exists in your `assets` folder), CloudFront serves the content of the requested JSON file.
5. **The OS Verifies the Content:**
    - iOS opens the `apple-app-site-association` file and looks for its app's **Bundle ID** inside. If it finds a match, it knows the link is legitimate.
    - Android opens the `assetlinks.json` file and looks for its app's **Package Name** and **SHA256 Fingerprint**. This cryptographic signature proves the app is authentic.
6. **The App Opens:** Once the OS has verified this proof, it says, "Great, I trust this connection." Instead of opening Safari or Chrome, it launches your mobile app and passes the full URL (`.../invite/xyz123`) directly to it.

This entire process is called **domain association** and it's a security feature. It prevents a malicious app from hijacking links meant for another app. Your CloudFront static site's only job in this phase is to reliably and quickly serve these two small proof files when the operating systems come looking for them.

## 2. Entitlements (iOS) & Intent Filters (Android)

These are the *other half* of the trust relationship. While the JSON files are the app's "claim" on the website, entitlements and intent filters are the app's way of telling the operating system, "I am officially associated with this website, and I'm ready to handle its links."

### **iOS: Associated Domains Entitlement**

- **What it is:** An entitlement is a capability or permission that you enable for your app within your Xcode project. The "Associated Domains" entitlement is a specific one that lets you register one or more domains with your app.
- **What it does:** When you add `applinks:links.your-app-domain.com` to this entitlement, you are hard-coding a message into your app that tells iOS: "When you see a link from `links.your-app-domain.com`, I am the designated app to open it."
- **The Connection:** iOS will only attempt the "handshake" (Step 3 above) if it finds an app installed with this entitlement. If no app has this entitlement, iOS won't even bother checking the website; it will just open Safari.

### **Android: Intent Filters**

- **What they are:** An intent filter is a component you declare in your app's `AndroidManifest.xml` file. It's a fundamental part of the Android OS that tells the system what kinds of "intents" (actions) your app can handle. An intent could be sharing an image, opening a location on a map, or, in our case, opening a URL.
- **What it does:** By adding an intent filter for your domain, you are telling the Android OS: "My app is a valid destination for `https://links.your-app-domain.com` URLs. I am prepared to receive and process them." You also include a flag (`android:autoVerify="true"`) which tells the OS to perform the verification by checking your `assetlinks.json` file upon installation.
- **The Connection:** Just like with iOS, the Android OS uses this intent filter to identify which app is supposed to handle a link. The `autoVerify` flag is the crucial piece that triggers the secure check of your website, turning a standard web link into a powerful App Link.

---

### iOS App Project in Xcode

The "Associated Domains Entitlement" is a setting inside the iOS application's project file. Your iOS developer will need to do the following:

1. Open the iOS project in **Xcode**.
2. Select the main application target in the project navigator.
3. Go to the **"Signing & Capabilities"** tab.
4. Click the **"+ Capability"** button.
5. Search for and add **"Associated Domains"**.
6. A new section will appear. Under "Domains," click the **"+"** button and add the following line:
`applinks:links.your-app-domain.com`

This tells the iOS operating system that this specific app is allowed to open links from that domain.

---

### Android App Project in Android Studio

The "Intent Filter" is an entry in a core configuration file for the Android app called `AndroidManifest.xml`. Your Android developer will need to do the following:

1. Open the Android project in **Android Studio**.
2. Open the `AndroidManifest.xml` file (usually located at `app/src/main/AndroidManifest.xml`).
3. Find the main `<activity>` that should handle the deep link.
4. Add a new `<intent-filter>` block inside that activity. The block should look like this:XML
    
    `<activity ...>
        <intent-filter android:autoVerify="true">
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="https" 
                  android:host="links.your-app-domain.com"
                  android:pathPrefix="/invite" />
        </intent-filter>
    </activity>`
    

This tells the Android operating system that this activity is prepared to handle HTTPS links from your specific domain that start with the `/invite` path. The `android:autoVerify="true"` flag is what triggers the secure check of your `assetlinks.json` file.

---

## Part 1: What You Need to Get (and Where to Fill It In)

This is the information you need to collect from your team.

### **For iOS 🍏**

- **What you need:**
    1. Your **Apple Team ID** (Example: `A1B2C3D4E5`)
    2. Your app's **Bundle ID** (Example: `com.spacetalk.app`)
- **Where to fill it:**
    - Open the file `assets/.well-known/apple-app-site-association`.
    - Replace `YOUR_TEAM_ID.YOUR_BUNDLE_ID` with the real values.
        - **Example:** `"appID": "A1B2C3D4E5.com.spacetalk.app"`

### **For Android 🤖**

- **What you need:**
    1. Your app's **Package Name** (Example: `co.spacetalk.app`)
    2. Your app's **SHA-256 Certificate Fingerprint** (Example: `FA:C6:17:45:...:3E`)
- **Where to fill it:**
    - Open the file `assets/.well-known/assetlinks.json`.
    - Replace `com.your.app.package_name` and `YOUR_SHA256_CERT_FINGERPRINT` with the real values.

### **For the Fallback Webpages 🌐**

- **What you need:**
    1. The final URL for your app on the **Apple App Store**.
    2. The final URL for your app on the **Google Play Store**.
- **Where to fill it:**
    - Open the file `assets/fallback.html`.
    - Find the `config` section at the top of the script.
    - Replace the placeholder URLs for `IOS_APP_STORE_LINK` and `ANDROID_PLAY_STORE_LINK_PREFIX`.

---

## Part 2: What You Provide to Your Mobile Engineers

You can copy and paste these instructions to your iOS and Android developers.

### **To Your iOS Engineer Entitlement:**

"Hi, we're setting up our new deep linking service. Please add the "Associated Domains" capability in Xcode and include the following domains for each environment:"

- **For Development builds:** `applinks:links.dev.cloud.spacetalk.co`
- **For Staging builds:** `applinks:links.test.cloud.spacetalk.co`
- **For Production builds:** `applinks:links.spacetalk.co`

### **To Your Android Engineer Intent filter:**

"Hi, we're setting up our new deep linking service. Please add an intent filter to the main activity in the `AndroidManifest.xml` to handle our new linking domains. Here is the configuration for each environment:"

- **For Development builds, add an intent filter for:** `https://links.dev.cloud.spacetalk.co`
- **For Staging builds, add an intent filter for:** `https://links.test.cloud.spacetalk.co`
- **For Production builds, add an intent filter for:** `https://links.spacetalk.co`


## Probabilistic Matching (Device Fingerprinting)

This is the most common and powerful fallback to the clipboard method. It works by matching the device that clicked the link with the device that opened the app, based on a set of shared, non-personal characteristics.

### The Whole Flow:

1. **User Clicks the Link (in Browser):**
    - A new user clicks the deep link: `https://links.spacetalk.co/getapp?token=abc...`
    - The browser opens your `fallback.html` page.
2. **Web Page Collects a "Fingerprint":**
    - The JavaScript in `fallback.html` runs instantly. Before redirecting, it collects a set of basic, publicly available device characteristics. This "fingerprint" might include:
        - IP Address (captured by the backend)
        - Device OS and Version (e.g., iOS 17.5)
        - Device Model (e.g., iPhone)
        - Browser and Version (e.g., Mobile Safari 17.5)
        - Language Setting (e.g., `en-US`)
        - Screen Resolution
3. **Web Page Sends Fingerprint to Your Backend:**
    - The script sends a "fire-and-forget" request to a new API endpoint on your server (e.g., `POST /graph/fingerprint`).
    - The request payload contains the fingerprint data along with the deep link URL (`https://links.spacetalk.co/...`).
    - Your backend service, like `inviteService.ts`, receives this data and stores it in a temporary cache (like Redis) with a short expiration time (e.g., 10-15 minutes). The key might be a hash of the fingerprint, and the value is the full deep link URL.
4. **Web Page Redirects to App Store:**
    - Immediately after sending the fingerprint, `fallback.html` redirects the user to the App Store.
5. **User Installs and Opens the App:**
    - The user downloads and opens your app for the very first time.
6. **App Collects its Own Fingerprint:**
    - On its first launch, your native iOS app collects the *exact same set of device characteristics* from the device's perspective (OS version, device model, language, etc.).
7. **App Asks the Backend for a Match:**
    - The app makes an API call to your backend (e.g., `POST /graph/match-link`).
    - The request payload contains the fingerprint data collected by the app. The backend also captures the user's IP address from this request.
8. **Backend Finds the Match:**
    - Your backend service receives the fingerprint from the app. It creates the same key it did in Step 3 (based on IP, OS, etc.).
    - It looks up this key in the cache. If it finds a matching entry that was created within the last few minutes, it has found a probable match.
    - The backend returns the full deep link URL it had stored in the cache to the app. To prevent duplicate matches, it deletes the entry from the cache after returning it.
9. **App Navigates:**
    - The app receives the deep link URL from the backend and can now parse it to get the token and navigate the user to the correct screen.


## Debug

- The cloudFront - Apple CDN Cache - We use it
  - The Apple CDN caches can be check from : https://app-site-association.cdn-apple.com/a/v1/linkd.spacetalk.co, the cache time is max-age, so if you update the file, you need to wait for max-age time to see the change., then refresh to see whether it is updated.
  - Apple .well-known/apple-app-site-association file validator: https://branch.io/resources/aasa-validator/
  - this file should be served with Content-Type: application/json

- After cache clean, uninstall the app from device, then re-install the app, otherwise, it will not trigger the apple check again.