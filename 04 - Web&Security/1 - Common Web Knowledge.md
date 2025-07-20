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
  - Another one is UDP compared to TCP
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
    - Render HTML(initial stage no matter ssr or csr) or return JSON
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

## 5. GET vs POST

You use **GET** to **retrieve** data from a server and **POST** to **submit** data to a server to create or update a resource.

The simplest rule of thumb is this: if you are only **reading** or **fetching** information, use GET. If you are **changing** something on the server—creating, updating, or deleting—use POST (or other methods like PUT, PATCH, DELETE).

---

Comparison: GET vs. POST

| Feature | GET | POST |
| --- | --- | --- |
| **Purpose** | To **retrieve** data that already exists. | To **submit** data to be processed, often creating a new resource. |
| **Idempotency** | ✅ **Idempotent**. Making the same GET request multiple times will produce the same result. | ❌ **Not Idempotent**. Making the same POST request multiple times will likely create multiple new resources. |
| **Data Location** | Data is passed in the **URL query string**. (`/users?id=123`) | Data is sent in the **request body**. |
| **Security** | ❌ **Less secure for sensitive data**. Data is visible in the URL, browser history, and server logs. | ✅ **More secure for sensitive data**. The request body is not stored in browser history or server logs. (Note: Use HTTPS for actual encryption). |
| **Caching** | ✅ Can be **cached** by browsers and proxies, leading to faster load times. | ❌ Not cached by default. |
| **Bookmarking** | ✅ Can be **bookmarked** and shared easily. | ❌ Cannot be bookmarked. |
| **Data Size** | Limited by URL length (usually ~2048 characters). | No practical limit on data size. |

---

**Never use GET for state-changing actions.** A classic mistake is creating a "delete" link like `<a href="/products/delete?id=123">Delete</a>`. This is dangerous because a search engine crawler or a browser's pre-fetching mechanism could follow that link and unintentionally delete data from your database. Any action that modifies data must use POST, PUT, PATCH, or DELETE.

## 6. Request and Reponse Infomation

---

➡️ The Request (Client to Server)

When your browser or application asks a server for something, it sends a request containing three main parts.

1. **Request-Line**: A single line that says what you want.
    - **Method**: The action to be performed (e.g., `GET`, `POST`).
    - **Path**: The target resource on the server (e.g., `/api/users/123`).
    - **HTTP Version**: The protocol version (e.g., `HTTP/1.1`).

        `GET /users/123 HTTP/1.1`

2. **Headers** 📝: Key-value pairs that provide metadata about the request.
    - **`Host`**: The domain name of the server (e.g., `api.example.com`). This is required.
    - **`User-Agent`**: Identifies the client making the request (e.g., `Mozilla/5.0 ... Chrome/126.0.0.0`).
    - **`Accept`**: The content types the client can understand (e.g., `application/json`).
    - **`Authorization`**: Credentials for accessing a protected resource (e.g., `Bearer eyJhbGci...`).
3. **Body** 📦: The actual data being sent to the server. This is primarily used with `POST`, `PUT`, and `PATCH` requests. For a `GET` request, the body is empty.JSON

    `{
      "username": "newuser",
      "email": "new@example.com"
    }`

---

⬅️ The Response (Server to Client)

After processing the request, the server sends back a response, which has a similar structure.

1. **Status-Line**: A single line that says what happened.
    - **HTTP Version**: The protocol version (e.g., `HTTP/1.1`).
    - **Status Code**: A 3-digit code indicating the result.
        - `2xx` (e.g., `200 OK`): Success ✅
        - `3xx` (e.g., `301 Moved Permanently`): Redirection
        - `4xx` (e.g., `404 Not Found`): Client-side error ❌
        - `5xx` (e.g., `500 Internal Server Error`): Server-side error 💥
    - **Status Text**: A human-readable message for the code (e.g., `OK`).

        `HTTP/1.1 200 OK`

2. **Headers** 📝: Key-value pairs that provide metadata about the response.
    - **`Content-Type`**: The MIME type of the data in the body (e.g., `application/json`, `text/html`).
    - **`Content-Length`**: The size of the response body in bytes.
    - **`Cache-Control`**: Instructions on how the client should cache this response.
    - **`Set-Cookie`**: Tells the browser to save a cookie.
3. **Body** 📦: The actual content requested. This could be an HTML page, a JSON object, an image file, or anything else. For a successful `GET` request, this is where you find what you asked for.JSON

    `{
      "id": 123,
      "username": "alex_jones",
      "createdAt": "2025-07-20T07:41:12Z"
    }`
