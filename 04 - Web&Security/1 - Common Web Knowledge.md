## 1. What Happens When You Type a URL in a Browser and Press Enter?

This is a step-by-step journey through:

- url parsing
  - split into protocxol, host, path, port
- DNS
  - rowser checks if it already knows the IP `xxx.com`
  - If not:
    - Sends DNS query → Resolver → Root DNS → TLD → Authoritative DNS
    - Gets back **IP address** (e.g. `104.18.10.84`)
  - This is how `xxx.com` becomes a real machine on the internet
- TCP/IP
  - Browser opens a TCP connection with the server:
    - SYN → SYN-ACK → ACK (3-way handshake)
  - Ensures both client and server are ready to talk reliably
- HTTP/HTTPS
  - https:
    - Encrypts communication
    - Steps:
      - Client gets server’s SSL certificate
      - Verifies it’s trusted (not expired, matches domain, signed by CA)
      - Negotiates encryption method (e.g., AES) and shares a secret key
    - From now on, everything is **encrypted**
  - http request send
- Server-side response
  - Web server (e.g. Nginx or Express.js backend) routes the request
  - Might:
    - Authenticate the user
    - Query a database
    - Render HTML or return JSON
  - request send back
- Browser rendering
  - Parses HTML → builds **DOM tree**
  - Downloads CSS, JS, images
  - Applies CSS, runs JS, renders UI
  - May fetch more data via AJAX (`fetch`, `XMLHttpRequest`)

```
Browser ➜ DNS ➜ IP
      ➜ TCP ➜ TLS
      ➜ HTTP Request ➜ Server
      ⇦ HTTP Response ⇦
      ⇨ Render UI ⇨

```

## 2. HTTP & HTTPS

### 2.1 What is HTTP?

- **Hypertext Transfer Protocol**
- It's how **clients (like browsers)** talk to **servers**
- Works over **TCP** (port 80)
- Stateless – no memory of previous requests

---

### 2.2 What is HTTPS?

- **HTTP over TLS (secure)**
- All HTTP traffic is encrypted with **TLS**
- Uses port **443**
- Protects against:
  - Eavesdropping
  - Tampering
  - Man-in-the-middle (MITM) attacks

### 2.3 Common HTTP Status Codes

✅ Success:

- `200 OK`: request succeeded
- `201 Created`: POST success
- `204 No Content`: success, no response body

🔁 Redirection:

- `301 Moved Permanently`
- `302 Found` (temporary redirect)

❌ Client Error:

- `400 Bad Request`: malformed syntax
- `401 Unauthorized`: not logged in
- `403 Forbidden`: no permission
- `404 Not Found`: resource missing

💥 Server Error:

- `500 Internal Server Error`
- `502 Bad Gateway`
- `503 Service Unavailable`

### 2.4 Headers You Should Know

📤 Request Headers

| Header | Purpose |
| --- | --- |
| `Host` | Target domain |
| `User-Agent` | Browser info |
| `Authorization` | Bearer tokens |
| `Cookie` | Session or login data |
| `Accept` | What kind of response is expected |

📥 Response Headers

| Header | Purpose |
| --- | --- |
| `Content-Type` | Tells browser how to handle response |
| `Set-Cookie` | Creates cookie on client |
| `Cache-Control` | Defines cache rules |
| `Access-Control-Allow-Origin` | CORS settings |

## 3. Cookies, Sessions, and JWTs (Authentication & State in Web)

### 3.1. Cookies

✅ What are cookies?

- Small key-value pairs stored in the **browser**
- Sent **automatically** with every HTTP request to the same domain

✅ Created via:

- `Set-Cookie` in HTTP response

```
Set-Cookie: session_id=abc123; HttpOnly; Secure; Max-Age=3600

```

✅ Features:

- `HttpOnly`: JS can’t read it → protects from XSS
- `Secure`: only sent over HTTPS
- `Max-Age` / `Expires`: duration
- `SameSite`: protects against CSRF

---

### 3.2. Sessions

✅ What’s a session?

- A server-stored object (in memory or DB) with info like:

    ```json
    {
      "session_id": "abc123",
      "user_id": 42,
      "logged_in": true
    }
    ```

- The browser just sends `session_id` (via cookie)
- The server checks that session ID and gets user info

✅ Common in:

- Traditional logins
- PHP, Django, Express session middleware

---

### 3.3. JWT (JSON Web Token)

✅ What is JWT?

- A **signed** token that carries user data
- No need to store anything on the server
- Structure:

```
eyJhbGciOi... (header.payload.signature)
```

Decoded:

```json
{
  "user_id": 42,
  "role": "admin",
  "exp": 1726026501
}
```

✅ Pros:

- Stateless (no DB check needed)
- Works well with microservices or APIs

❗ Cons:

- Can’t be revoked easily
- Should be stored securely (often in memory or HTTP-only cookie)

---

### 3.4 Cookie vs Session vs JWT

| Feature | Cookie | Session | JWT |
| --- | --- | --- | --- |
| Stored where | Browser | Server | Browser |
| Stateless? | ❌ No | ❌ No | ✅ Yes |
| Secure? | ✅ if set properly | ✅ if implemented | ✅ if encrypted |
| Scalable? | ❌ needs storage | ❌ needs storage | ✅ good for APIs |
| Revoke-able? | ✅ Yes (by server) | ✅ Yes | ❌ Not easily |

---

Example: Logging into a website

1. You POST login credentials.
2. Server validates them.
3. Server:
    - Either creates a session & sends a cookie
    - Or generates a JWT & sends it as a cookie or in header
4. Your browser stores it, sends it on every request
5. Server checks token/session to identify you

---

## 4. Browser Storage: Cookies vs `localStorage` vs `sessionStorage`

| Feature | `Cookies` | `localStorage` | `sessionStorage` |
| --- | --- | --- | --- |
| Storage Location | Sent with every HTTP request | Browser only | Browser only |
| Max Size | \~4 KB | \~5–10 MB | \~5–10 MB |
| Lifetime | Can expire (set via `Expires` or `Max-Age`) | Until manually cleared | Until tab closes |
| Accessible by JS? | ❌ Only if not `HttpOnly` | ✅ Yes | ✅ Yes |
| Auto Sent with Requests | ✅ Yes | ❌ No | ❌ No |
| Security Risk | XSS & CSRF if misused | XSS if misused | XSS if misused |

---

🍪 Cookies

- **Used for authentication, sessions**
- Can be:
  - `HttpOnly` → inaccessible to JS (more secure)
  - `Secure` → only sent over HTTPS
  - `SameSite` → restricts cross-site requests (protects against CSRF)
- Limited in size (\~4 KB)

---

🗃️ `localStorage`

- Key-value store:

    ```
    localStorage.setItem("theme", "dark");
    localStorage.getItem("theme"); // "dark"
    ```

- Survives tab and browser restarts
- Not sent in HTTP requests

---

🕑 `sessionStorage`

- Same API as `localStorage`:

    ```
    sessionStorage.setItem("draft", "text");
    ```

- **Dies when the tab is closed**
- Useful for temporary state

---

⚠️ Security Considerations

- Never store sensitive info (like passwords or JWTs) in `localStorage` or `sessionStorage` — vulnerable to **XSS**
- Use `HttpOnly` cookies for session tokens when possible

---

🔄 When to Use What?

| Use Case | Best Storage |
| --- | --- |
| Authentication token (safely) | `HttpOnly` Cookie |
| User preferences (theme, language) | `localStorage` |
| Form draft during a session | `sessionStorage` |
| CSRF protection | Cookie + SameSite flag |

## 5. When you click a button in the browser

Case 1: **Purely Frontend Button**

- Browser detects the click (`click` event).
- JavaScript executes instantly in the browser.
- DOM is modified (e.g., changes color, hides text).
- No HTTP request, no server, no network.
- Immediate UI update — all in the user's browser.

---

Case 2: **Backend-Connected Button**

1. Click triggers JavaScript event.
2. JS sends HTTP request (`fetch()`).
3. Browser performs DNS lookup, TLS handshake (if HTTPS).
4. Server receives request, runs backend logic (auth, DB queries).
5. Server sends back a response (e.g., JSON).
6. JS receives the data and updates the DOM accordingly.
