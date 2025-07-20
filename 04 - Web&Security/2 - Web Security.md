### 🦠 1. **XSS (Cross-Site Scripting)**

> Injecting JavaScript into a webpage that gets executed in another user’s browser.
>

```html
<input value="<script>alert('hacked')</script>">
```

Fix:

- Escape user input before rendering.
- Use frameworks that auto-sanitize (e.g., React).
- Set Content Security Policy (CSP) headers.

---

❌ Example in React:

```jsx
<div dangerouslySetInnerHTML={{ __html: user.bio }} />
```

If `user.bio = "<script>alert('hacked')</script>"`, the attacker runs arbitrary JS.

---

✅ React Solution:

- Never use `dangerouslySetInnerHTML` unless absolutely necessary.
- Sanitize user input if rendering raw HTML (use a lib like `dompurify`):

```jsx
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(user.bio) }} />
```

---

✅ Node.js (Express) Tips:

- Escape HTML when redering from the server (use `ejs`, `handlebars`, etc. safely).
- Set **Content Security Policy (CSP)** headers, `helmet`:

```
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
  }
}));
```

### 🎣 2. **CSRF (Cross-Site Request Forgery)**

> Tricking a user into making unwanted authenticated requests.
>

Example:

If you're logged into `bank.com`, a malicious site could do:

```html
<img src="https://bank.com/transfer?to=hacker&amount=1000">
```

Fix:

- Use **CSRF tokens** that are validated per request. ( Implement Anti-CSRF Tokens )
- Use `SameSite=Strict` attribute on your session cookies.. (The browser will not send the cookie on *any* cross-site request. )
- Require re-authentication for sensitive actions.
- Using Post Rather than Get: Any action that changes data **must not** use a `GET` request
- Using HTTPS anytime

---

✅ React + Node.js Protection:

A. Use `SameSite=Strict` on cookies:

```
res.cookie('session_id', 'abc123', {
  httpOnly: true,
  sameSite: 'Strict',
  secure: true
});
```

B. Use CSRF tokens (backend):

Install `csurf` middleware:

```
const csrf = require('csurf');
app.use(csrf({ cookie: true }));
```

Send token to React via meta or JSON, then React sends it back in a header/form.

### 🕵️ 3. **Authentication vs Authorization**

| Concept | Meaning |
| --- | --- |
| Authentication | Who are you? (login) |
| Authorization | What are you allowed to do? |

> Interview trick: Make sure you don’t confuse these two.
>
- Authentication: Check login status via cookies/JWT.
- Authorization: Check req.user.role === 'admin' in Node before sensitive actions.

---

### 🧾 4. **Cookies vs Tokens (JWT)**

| Feature | Cookies | Tokens (JWT, etc.) |
| --- | --- | --- |
| Stored in | Browser cookie jar | JS memory / `localStorage` |
| Auto-sent? | ✅ Yes | ❌ Only if manually added |
| Vulnerable to XSS | ✅ (esp. if not `HttpOnly`) | ✅ if in localStorage |
| CSRF risk | ✅ Yes | ❌ Usually safe |

✅ Use cookies with `HttpOnly`, `Secure`, `SameSite=Strict`

---

### ⚠️ 5. **Common Security Headers**

- `Content-Security-Policy`: Prevent inline scripts / limit resources.
- `X-Frame-Options`: Prevent clickjacking.
- `Strict-Transport-Security`: Force HTTPS.
- `X-Content-Type-Options`: Avoid MIME-type sniffing.

Use the `helmet` middleware in Express:

---

### 🧬 6. **Hashing & Salting Passwords**

Never store passwords in plaintext.

Use:

- **Hashing**: irreversible (e.g., bcrypt, scrypt, Argon2)
- **Salting**: add random string to each password before hashing
- Prevents precomputed attacks (rainbow tables)

```jsx
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(inputPassword, hash);
```

---

### 🧱 7. **SQL Injection**

> Attackers inject SQL code via input to manipulate queries.
>

Example:

```sql
SELECT * FROM users WHERE name = '$input';
```

If `$input` = `' OR 1=1 --`, the attacker logs in as anyone.

Fix:

- Use **parameterized queries / prepared statements**.
- In React: Always sanitize inputs and validate before sending.

```sql
db.query('SELECT * FROM users WHERE name = ?', [[req.body.name](http://req.body.name/)])
```

---

### 🔍 8. **OWASP Top 10**

The **most critical web security risks** — updated regularly. You don’t need to memorize all, but know a few:

- Injection (SQL, NoSQL, OS commands)
- Broken authentication
- Sensitive data exposure
- XSS
- Insecure deserialization

Website: [https://owasp.org](https://owasp.org/)

---

### 9. brute force and rate limit

| Technique | Node.js Middleware | Goal |
| --- | --- | --- |
| Rate Limiting | `express-rate-limit` | Prevent brute-force/login spam |
| Request Slowdown | `express-slow-down` | Deter bots via delay |
| CAPTCHA | Frontend + backend check | Verify human |
| Login attempt tracking | Custom DB/cache logic | Lock accounts on abuse |
| Token throttling | Count per-user token usage | Prevent API abuse |
