# 1. Frontend Checklist for Websites

## Performance

### General

- [ ] **HTTP/2 is being used** (Enables faster web Browse through features like multiplexing and server push. Best practice: Enable it on your web server (Nginx/Apache) or use a hosting provider/CDN that supports it by default.)
- [ ] **CDN is used for static files** (Delivers assets like CSS, JS, and images from servers closer to the user for faster downloads. Best practice: Use a CDN provider like Cloudflare, AWS CloudFront, or Fastly and configure your build process to serve assets from it.)
- [ ] **CDN is used for content pages** (Caches and serves entire HTML pages from edge locations to dramatically reduce response times. Best practice: Configure page caching rules within your CDN dashboard for pages with static or slow-changing content.)
- [ ] **Cookie-Less Domain is used for static files** (Prevents sending unnecessary cookie data with asset requests, reducing request size. Best practice: Set up a separate subdomain (e.g., `static.yourdomain.com`) to serve assets and ensure no cookies are set on it.)
- [ ] **DNS prefetching is used** (Resolves domain names in the background before a user clicks a link. Best practice: Add `<link rel="dns-prefetch" href="//example.com">` to your HTML `<head>` for third-party domains.)
- [ ] **`<link rel="preload" as="script">` (CSS, JS and fonts)** (Tells the browser to fetch high-priority resources early in the loading process. Best practice: Add `<link rel="preload" href="critical.js" as="script">` to the `<head>` for resources needed for the initial render.)
- [ ] **`<link rel="dns-prefetch">` (for Domain, which provides static resources, eg.: Images, and Tracking Tools)** (Resolves the DNS for third-party domains in advance to speed up resource fetching. Best practice: Add `<link rel="dns-prefetch" href="//fonts.googleapis.com">` for any third-party services you use.)

---

### Resources

- [ ] **JavaScript combined in one file** (Reduces the number of HTTP requests needed, though less critical with HTTP/2. Best practice: Use a modern build tool like Vite or Webpack which handles code splitting and bundling automatically.)
- [ ] **JavaScript minified** (Removes unnecessary characters like whitespace and comments from code to reduce file size. Best practice: Automate this step in your build process using tools like Vite, Webpack, or Terser.)
- [ ] **JavaScript is compressed** (Uses algorithms like gzip or Brotli to make the file size smaller for transfer over the network. Best practice: Enable gzip or Brotli compression on your web server or CDN for `text/javascript` content types.)
- [ ] **No JavaScript inline** (Allows JavaScript to be cached by the browser and separates behavior from content. Best practice: Place all JavaScript in external `.js` files and link them, avoiding `<script>` tags with code inside.)
- [ ] **CSS combined in one file** (Reduces the number of HTTP requests, similar to combining JavaScript. Best practice: Let your build tool (Vite, Webpack) handle CSS bundling and splitting for optimal loading.)
- [ ] **CSS minified** (Removes unnecessary characters from CSS code to reduce file size. Best practice: Integrate a CSS minifier like `cssnano` into your automated build process.)
- [ ] **CSS is compressed** (Uses gzip or Brotli to further reduce the size of CSS files for faster transfer. Best practice: Configure your web server or CDN to apply compression to `text/css` content types.)
- [ ] **CSS: No usage of `@import`** (Avoids using `@import` inside CSS files as it can block parallel downloads. Best practice: Use a pre-processor like Sass or your build tool to combine multiple CSS files into one.)
- [ ] **No CSS inline** (Allows CSS to be cached and separates presentation from content for better maintenance. Best practice: Keep all styles in external `.css` files, avoiding the use of the `style` attribute in HTML.)
- [ ] **HTML minified** (Removes unnecessary whitespace, comments, and characters from the HTML to reduce its size. Best practice: Use a plugin in your build tool or framework to automatically minify HTML output.)
- [ ] **Static files are compressed with gzip or brotli** (Significantly reduces the transfer size of text-based assets like HTML, CSS, and JS. Best practice: Enable compression at the server (Nginx/Apache) or CDN level for all text-based file types.)
- [ ] **Static files are pre-compressed on the server** (Saves CPU by compressing assets once ahead of time, instead of on every request. Best practice: Use a build plugin to create `.gz` and `.br` versions of your assets during deployment.)
- [ ] **HTML is compressed with gzip or brotli** (Reduces the download size of the main page document itself. Best practice: Ensure your server or CDN is configured to compress `text/html` content.)
- [ ] **Usage of correct image formats** (Employs modern formats like WebP or AVIF for better compression and quality. Best practice: Use the `<picture>` element to serve WebP/AVIF with a JPEG/PNG fallback.)
- [ ] **Usage of responsive images** (Serves appropriately sized images based on the user's screen size to save bandwidth. Best practice: Use the `srcset` and `sizes` attributes on `<img>` tags to provide multiple image sources.)
- [ ] **Images are optimized (ImageOptim…)** (Reduces image file sizes without a noticeable loss in quality. Best practice: Automate image compression in your build process using tools like `imagemin`.)
- [ ] **Image are cached in the browser** (Uses cache headers to store images locally, so they don't need to be re-downloaded. Best practice: Configure your server to send long `Cache-Control: max-age` headers for image files.)
- [ ] **SVG files are minized** (Removes unnecessary editor metadata and code from SVGs to make them smaller. Best practice: Run SVGs through an optimization tool like `svgo` as part of your build process.)
- [ ] **SVG files are used where possible** (Uses vector graphics for icons and logos as they are resolution-independent and often smaller. Best practice: Replace PNG or GIF icons with inline SVG or linked `.svg` files.)
- [ ] **Only fonts that are used are loaded** (Avoids loading unused font weights or styles to reduce page weight and render time. Best practice: Specify only the needed weights/styles in your `@font-face` declarations and subset the font files.)
- [ ] **Browser cache is used efficiently** (Configures cache headers correctly so browsers can store assets locally. Best practice: Set a long `max-age` for static assets and use a file-hashing strategy for cache busting.)
- [ ] **ETags is not used** (Avoids `ETag` validation headers, as they can be configured incorrectly in multi-server setups. Best practice: Disable ETags in your server configuration and rely on `Last-Modified` and `Cache-Control` headers.)
- [ ] **Expires, cache-control and max-age headers for static resources is set to 1 year** (Instructs the browser to cache unchanging assets for a very long time. Best practice: Set `Cache-Control: public, max-age=31536000, immutable` on fingerprinted assets via server config.)
- [ ] **Asychronous or deferred loading of non-critical content** (Prevents non-essential resources from blocking the initial, visible rendering of the page. Best practice: Use the `defer` attribute for non-critical scripts and lazy-load images below the fold.)
- [ ] **Tracking scripts loaded asynchronously** (Ensures analytics or advertising scripts do not slow down the user-facing content. Best practice: Use the `async` attribute on third-party `<script>` tags whenever possible.)

---

### Measurements

- [ ] **Count of all files** (A metric for the total number of HTTP requests the page makes. Best practice: Measure using browser DevTools (Network tab) or WebPageTest.org and aim to reduce requests via bundling.)
- [ ] **Size of all files combined** (The total "page weight" in KB/MB that the user must download. Best practice: Measure using DevTools or performance tools and aim to keep it low, especially for mobile.)
- [ ] **Download time of the page** (The time it takes to load the entire page over a specific network condition. Best practice: Test with a throttled network profile in DevTools to simulate real-world conditions.)
- [ ] **Google Page Speed analysis (Desktop, Mobile and Mobile UX; x of 100)** (A standardized score from Google measuring performance, accessibility, and best practices. Best practice: Regularly run tests on PageSpeed Insights and address the opportunities it identifies.)
- [ ] **SpeedIndex** (A performance metric that measures how quickly the content above the fold is visually displayed. Best practice: Monitor this metric via tools like WebPageTest and improve it by prioritizing critical CSS and deferring JS.)

---

### Rendering Performance

- [ ] **Intrinsic image sizes are specified in the markup** (Sets `width` and `height` attributes on images to prevent content from shifting as they load. Best practice: Always include `width` and `height` attributes on your `<img>` and `<video>` tags.)
- [ ] **CSS is loaded in the document head** (Ensures the page is styled before content is displayed, preventing a "flash of unstyled content." Best practice: Always place `<link rel="stylesheet">` tags inside the `<head>` of your HTML.)
- [ ] **Scripts are loaded at the end of the document** (Prevents render-blocking JavaScript from delaying the display of page content. Best practice: Place `<script>` tags just before the closing `</body>` tag, or use the `defer` attribute.)
- [ ] **Scripts are loaded with defer attribute** (Allows the browser to download scripts in parallel while parsing HTML, executing them after. Best practice: Use `defer` for all non-critical scripts that don't need to execute immediately.)
- [ ] **Scripts are loaded in the document head after styles are loaded** (A specific loading pattern to ensure styles are applied before scripts manipulate the DOM. Best practice: Place `<link rel="stylesheet">` before `<script>` tags within the `<head>`.)
- [ ] **Scrolling is possible with 60fps** (Ensures a smooth, "jank-free" scrolling experience for the user. Best practice: Use passive event listeners for scroll/touch events and avoid heavy computation during scroll.)
- [ ] **No usage of document.write** (Avoids a legacy practice that can severely block page rendering and hurt performance. Best practice: Manipulate the DOM using modern APIs like `createElement` and `appendChild` instead.)
- [ ] **CSS animation causing layout(reflow) is not heavily used** (Prioritizes animating performant properties like `transform` and `opacity` over layout-heavy ones like `width`. Best practice: Use CSS `transform` and `opacity` for animations; check changes in the DevTools rendering panel.)

---

### Device performance

- [ ] **CPU usage** (Measures how much processing power the page consumes, affecting battery life and responsiveness. Best practice: Use the browser's performance profiler to identify and optimize long-running JavaScript tasks.)
- [ ] **Memory usage** (Measures the amount of RAM the page uses, which can cause sluggishness if excessive. Best practice: Use the DevTools Memory panel to check for memory leaks, especially in single-page applications.)
- [ ] **GPU usage** (Measures the load on the graphics processor, crucial for smooth animations and transitions. Best practice: Promote animated elements to their own layer using `will-change: transform` to offload work to the GPU.)

---

## Cross-Browser

- [ ] **Website is loading on all current desktop browsers (Safari, Firefox, Chrome, IE11, EDGE)** (Ensures a consistent and functional experience for all major desktop users. Best practice: Use a service like BrowserStack for testing and a tool like Autoprefixer for CSS compatibility.)
- [ ] **Website is loading on all current mobile browser (Chrome for Android, iOS Safari)** (Ensures a consistent experience for the vast majority of mobile users. Best practice: Test on real devices or use the device mode in browser DevTools during development.)
- [ ] **For Shops: Checkout is usable on all necessary devices and browsers** (Confirms that this critical business flow works everywhere to prevent lost revenue. Best practice: Create an automated end-to-end test suite for the checkout flow that runs on multiple browsers.)
- [ ] **Viewport Meta Tag is used correctly** (Ensures the website is displayed properly and scaled correctly on mobile devices. Best practice: Include `<meta name="viewport" content="width=device-width, initial-scale=1">` in your HTML `<head>`.)
- [ ] **Usage of correct input types** (Uses specific input types like `email` or `tel` to trigger appropriate mobile keyboards. Best practice: Use `type="email"`, `type="number"`, `type="tel"`, etc., on `<input>` fields to improve mobile usability.)

---

## SEO

- [ ] **Pages can be indexed** (Confirms that search engines are not blocked from crawling and listing your pages. Best practice: Ensure your `robots.txt` is not disallowing key pages and there is no `<meta name="robots" content="noindex">` on them.)
- [ ] **Mobile version of website is available** (Crucial for a good user experience and ranking well in Google's mobile-first index. Best practice: Implement a responsive design that works well on all screen sizes.)
- [ ] **HTTPS is used on all pages** (Secures the site and serves as a positive ranking signal for search engines. Best practice: Install an SSL certificate and force all traffic from HTTP to HTTPS via server redirect.)
- [ ] **Sitemap is available** (Provides a map of your site to help search engines discover all important pages. Best practice: Generate an `sitemap.xml` file and submit it to Google Search Console.)
- [ ] **Structured-Data is used where possible** (Uses schema markup to help search engines understand content, enabling rich search results. Best practice: Add JSON-LD structured data for articles, products, events, etc., to your page templates.)
- [ ] **Headlines used** (Uses `<h1>`, `<h2>`, etc., to structure content for readability and search engines. Best practice: Ensure every page has one `<h1>` and a logical hierarchy of `<h2>`, `<h3>`, etc.)
- [ ] **Headlines in correct order** (Follows a logical `<h1>` -> `<h2>` -> `<h3>` hierarchy for accessibility and SEO. Best practice: Do not skip heading levels (e.g., an `h4` directly after an `h2`); check with a document outliner.)
- [ ] **Meta descriptions used** (Provides the summary text that often appears below the title in search results. Best practice: Write a unique, compelling description of ~155 characters for each page.)
- [ ] **Meta keywords used** (A mostly deprecated tag that is largely ignored by major search engines. Best practice: Omit this tag as it provides no value and can expose your keyword strategy.)
- [ ] **Meta title is filled correctly** (Ensures each page has a unique and descriptive title, a key SEO ranking factor. Best practice: Write a unique `<title>` of under 60 characters for each page, with important keywords first.)
- [ ] **Keywords used in headlines** (Signals the page's topic to both users and search engines. Best practice: Naturally include the page's main keyword in the `<h1>` and relevant sub-keywords in subheadings.)
- [ ] **Images use the alt attribute** (Provides alternative text for screen readers and search engines to understand image content. Best practice: Write a descriptive `alt` attribute for every meaningful image; leave it empty (`alt=""`) for decorative ones.)
- [ ] **Links use a title attribute** (Provides supplementary information about a link's destination on hover. Best practice: Use sparingly, only when the link's purpose isn't obvious from the anchor text itself.)
- [ ] **Links in navigation do not use title attribute** (Avoids redundancy, as navigation link text should already be clear and descriptive. Best practice: Omit the `title` attribute from all primary navigation links.)
- [ ] **No Duplicate Content** (Ensures that the same content doesn't exist on multiple URLs, which can dilute SEO value. Best practice: Use `301` redirects and the `rel="canonical"` tag to point to a single source of truth.)
- [ ] **Usage of absolute URLs** (Uses full URLs (e.g., `https://site.com/page`) to prevent crawling issues. Best practice: Use absolute paths for all internal links, especially for canonical tags and sitemaps.)
- [ ] **Internal links point to HTTPS version of page** (Avoids unnecessary redirects and maintains a secure Browse experience. Best practice: Ensure all internal `<a>` links use `https://`.)
- [ ] **Redirects are done with 301** (Uses a "permanent" redirect to pass link equity (SEO value) to the new URL. Best practice: Configure your server to use `301` status codes for permanently moved content.)
- [ ] **No 404-errors** (Ensures there are no broken internal links, which harm user experience and waste crawl budget. Best practice: Regularly use a tool like Screaming Frog or Google Search Console to find and fix broken links.)
- [ ] **No 500-errors** (Confirms there are no critical server errors preventing access to pages. Best practice: Monitor server logs and set up alerts to be notified of any `5xx` errors.)
- [ ] **Canonical Tags are used if applicable** (Specifies the "master" version of a page to consolidate SEO value and prevent duplicate content. Best practice: Add a `<link rel="canonical" href="...">` tag to all pages pointing to the preferred URL.)
- [ ] **Ratio of code and content is around 25% for shop pages and 50% for content pages** (A guideline to ensure pages have a healthy amount of unique content compared to boilerplate code. Best practice: Focus on providing valuable content rather than this specific ratio, but use it as a red flag for thin pages.)

---

## Accessibility

- [ ] **Color Contrast is good (WCAG 2.0)** (Ensures text is readable for users with visual impairments by having sufficient contrast. Best practice: Use browser developer tools or online contrast checkers to verify color combinations meet at least WCAG AA standards.)
- [ ] **WAI-ARIA roles are used** (Enhances accessibility by adding roles and properties for assistive technologies like screen readers. Best practice: Use semantic HTML first; only add ARIA roles (`role="navigation"`) to custom components or to fix non-semantic HTML.)
- [ ] **Usage of accessible elements like nav, footer, aside** (Uses semantic HTML5 elements to define the structure of the page for all users. Best practice: Use `<nav>`, `<main>`, `<footer>`, `<header>`, `<section>`, and `<article>` instead of generic `<div>` tags.)
- [ ] **URLs are accessible** (Ensures URLs are human-readable and logically describe the page's content. Best practice: Use clean, keyword-rich slugs like `/services/web-design` instead of `/p?id=123`.)
- [ ] **Keyboard accessibility is available** (Allows users to navigate and interact with all site features using only a keyboard. Best practice: Regularly `Tab` through your site to ensure all interactive elements are focusable and in a logical order.)
- [ ] **Correct input types are used** (Improves the experience for users on mobile and with assistive technologies. Best practice: Use specific types like `<input type="email">` and link them to a `<label>` tag using the `for` attribute.)

---

## Security

- [ ] **HTTPS is used on all pages** (Encrypts all communication between the user's browser and the server. Best practice: Enable SSL/TLS on your server and implement a `301` redirect from HTTP to HTTPS.)
- [ ] **There is no mixed content on the pages** (Prevents insecure (HTTP) assets like images or scripts from being loaded on a secure (HTTPS) page. Best practice: Ensure all asset URLs in your code use `https://` or protocol-relative `//`.)
- [ ] **external plugins and trackings get loaded via HTTPS** (Ensures third-party scripts are also loaded securely. Best practice: Always copy the `https` version of third-party script snippets.)
- [ ] **Robots.txt is in use** (Provides instructions to web crawlers about which pages they should or should not crawl. Best practice: Create a `robots.txt` file in your root directory, disallowing admin or private areas.)
- [ ] **Cross-Site-Scripting is not possible** (Protects the site from attacks where malicious scripts are injected into web pages. Best practice: Sanitize all user-generated content before rendering it in the DOM and set a strong Content Security Policy.)
- [ ] **HSTS Header is set** (A security header that forces browsers to only communicate with your server over HTTPS. Best practice: Add the `Strict-Transport-Security` header in your server configuration.)
- [ ] **Content-Security-Policy is set and only allows specific hosts and no inline scripts** (A security header that helps prevent XSS attacks by whitelisting trusted content sources. Best practice: Implement a strict CSP header that disallows `unsafe-inline` and `unsafe-eval`.)

---

## More

- [ ] **Strict usage of domain with or without www** (Redirects one version to the other (e.g., `www.site.com` to `site.com`) to avoid duplicate content. Best practice: Set up a server-level `301` redirect to enforce one canonical domain.)
- [ ] **Correct language set in HTML tag** (The `lang` attribute in `<html>` helps browsers and screen readers process the text correctly. Best practice: Set the `lang` attribute on the `<html>` tag, e.g., `<html lang="en">`.)
- [ ] **Charset is set** (Specifies the character encoding to ensure all text displays correctly. Best practice: Add `<meta charset="UTF-8">` as the very first tag inside your HTML `<head>`.)
- [ ] **HTML is valid** (Ensures the HTML follows W3C standards, which promotes cross-browser compatibility. Best practice: Periodically check your pages with the W3C Markup Validation Service.)
- [ ] **404-page is available** (Provides a helpful, user-friendly "Not Found" page instead of a generic server error. Best practice: Create a custom `404.html` page with helpful links and configure your server to use it.)
- [ ] **A special print style sheet is in place** (Optimizes the page's layout for printing by removing unnecessary elements like navigation. Best practice: Use a media query (`@media print`) in your CSS to define print-specific styles.)

---

## Server

- [ ] **Correct language set by the server** (The server sends a `Content-Language` HTTP header to indicate the language of the document. Best practice: Configure your server (e.g., in `.htaccess` or `nginx.conf`) to send the appropriate `Content-Language` header.)
- [ ] **Correct content types set by the server** (The server sends the correct `Content-Type` header so the browser knows how to handle the file. Best practice: Ensure your web server is configured with the correct MIME types for all assets being served.)
