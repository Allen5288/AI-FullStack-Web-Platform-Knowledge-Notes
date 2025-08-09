## 1. When use CSR vs. SSR in Next.js.

| Feature                | **CSR (Client-Side Rendering)**                                                       | **SSR (Server-Side Rendering)**                          |
| ---------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Where it renders       | Browser (after JavaScript loads)                                                      | Server (HTML rendered before sending to client)          |
| Next.js hook/component | `useEffect`, dynamic import with `{ ssr: false }`                                     | `getServerSideProps`                                     |
| Performance            | Faster page transitions (after initial load), but slower FCP (First Contentful Paint) | Slower per request, but faster FCP                       |
| SEO                    | Poorer SEO (content is loaded after JS)                                               | Good SEO (HTML is ready for crawlers)                    |
| Use case               | Dashboards, user-specific data after login                                            | Landing pages, marketing, product pages, dynamic content |
| Example                | `<Chart />` with `useEffect` or lazy load                                             | `getServerSideProps` to fetch from API at request time   |

When to Use CSR in Next.js

- **After Login Pages** (e.g., admin dashboards)
- **Highly Interactive UIs** (charts, filters)
- **Real-time data** (WebSocket apps)
- When SEO doesn’t matter
- You want to reduce server load

When to Use SSR in Next.js

- Pages that need **SEO**
- Content that must be fresh on **each request**
- You need access to cookies/session on the server
- Marketing, e-commerce product pages