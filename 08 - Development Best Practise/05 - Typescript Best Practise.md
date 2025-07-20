# 1 Typescript best practice

## 1 Project Initialization

| Step | Recommendation | Description / Example |
| --- | --- | --- |
| **Enable all strict modes** | `strict: true` `noUncheckedIndexedAccess: true` `noImplicitOverride: true` etc. | Turn all strict options on first, then resolve issues one by one; short pain is better than long pain. |
| **Distinguish runtime & build targets** | Only put common rules in `tsconfig.base.json`; each package/service inherits and overrides `target`, `module`, `jsx`, etc. | Keep consistency in Monorepo setups. |
| **Path mapping** | Use `paths` + `baseUrl` to avoid relative hell `../../../` | `json "paths": { "@api/*": ["src/api/*"] }` |

---

## 2 Code Style & Readability

- **eslint + @typescript-eslint + prettier**: Keep formatting and semantic checks separate; must run in CI.
- **Naming**: Types use `PascalCase`, values use `camelCase`. Avoid abbreviations; for generics ≤2 use `T,U`, for >2 use semantic names like `TData`, `TError`.
- **Import order**: Third-party → alias paths → relative paths; always use `import type` for pure types to optimize tree-shaking.

---

## 3 Type System

### 3.1 Prefer `interface` over type alias (`type`)

```ts
interface User { id: string; name: string; }
```

- Interfaces can be incrementally merged, suitable for public models.
- `type` is suitable for unions, mapped, conditional types, and other advanced use cases.

### 3.2 Use `readonly` appropriately

Reduce side effects:

```ts
type Coordinates = readonly [number, number];
```

### 3.3 Distinguish precisely between "may be null/undefined" and "definitely has value"

```ts
function render(user?: User | null) {
  if (!user) return null;
}
```

Use with `noUncheckedIndexedAccess` to enforce boundary handling.

### 3.4 Interface Naming Conventions

也就是用名词而非动词 |

| Convention | Description & Example |
| --- | --- |
| **PascalCase** | All interface names use PascalCase: `User`, `OrderItem`, `AuthContext`. |
| **Avoid prefix `I*`** | Historically for C#/Java migration; not needed in modern TS, IDEs can distinguish type vs value. **Exception**: If required by backend/third-party protocol (gRPC, protobuf) and they use `IUser`, you can keep it. |
| **Noun-based** | Interface should describe "what it is" not "what it does": `Logger` ✅, `Logging` ❌; `PaymentStrategy` ✅, `Payable` ❌ (unless it's a mixin/trait). Use nouns, not verbs. |
| **Semantic suffixes** | - `*Props` → React component props: `ButtonProps`. - `*State` → local/global state: `CartState`. - `*Options / *Config` → optional config: `PaginationOptions`. - `*Event / *ChangeEvent` → event payload: `UserCreatedEvent`. |
| **Generic Interfaces** | If interface needs generics, use semantic parameters: `interface ApiResponse<TData, TMeta = unknown> { ... }`. Don't just use `T,U,V`. |
| **Local interface naming** | Small interfaces used only inside a function can be short, but still PascalCase: `function foo() { interface Tmp { x: number } ... }` |
| **Avoid overusing `Data`** | `UserData`, `FormData` are too generic; prefer the object name itself: `User`, `ContactForm`. If you need to distinguish DTO/VO, use suffixes like `UserDto`, `UserView`. |
| **Verb prefix only for capability interfaces** | If interface means "can do something", use adjectives/verbs: `Draggable`, `Serializable`, `Initializable`. |
| **Align with filename** | If interface is the main export of a module, name it after the file: `user.ts` exports `export interface User { ... }`; **ensure single responsibility**. |

**示例：**

```ts
// domains/order.ts
export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
}

// services/logger.ts
export interface Logger {
  info(msg: string): void;
  error(msg: string, err?: unknown): void;
}

// react/Table.tsx
export interface TableProps<TData> {
  data: readonly TData[];
  rowKey: keyof TData;
}
```

By unifying naming conventions, the team can **instantly recognize roles and usage**, quickly navigate large monorepos, and reduce semantic conflicts. To further automate this, configure the above patterns in eslint's `@typescript-eslint/naming-convention` rule.

---

## 4 Function & API Design

| Rule | Description |
| --- | --- |
| **Single return type** | Avoid returning object or `undefined` at the same time; use `Result<T, E>` pattern or `throw` |
| **Parameter objectification** | If parameters ≥3, pass an object and declare `Partial/Required` |
| **Keep pure functions** | Same for server-side/scripts; concentrate side effects in Service/Hook |

---

## 5 Classes & Object-Oriented

- Constructor parameters should be marked `private/public readonly` for automatic assignment.
- Do not perform async operations in constructors; use `init()` for async initialization.
- Use `abstract class` or `interface` to expose contracts, not implementations.

---

## 6 Generics & Advanced Types

1. Prefer inference: `function identity<T>(value: T) { … }` -> `identity(123)` infers `T = number`.

2. **Conditional types** solve API input/output differences:

```ts
type MaybeArray<T> = T extends any[] ? T : T[];
```

3. **Mapped types** replace manual redundancy:

```ts
type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };
```

---

## 7 Modules & Directory Structure

```ts
src/
 ├─ app/           // Next.js / Remix pages 或 React roots
 ├─ components/
 ├─ features/      // 按领域切分 (Redux Toolkit slice 等)
 ├─ hooks/
 ├─ services/      // api-client, business logic
 ├─ types/         // 公共类型声明 (never 直接 import 组件代码)

```

> Prefer feature-based (domain-driven) structure over layer-driven (MVC).
>

---

## 8 React + TypeScript Special Practices

| Scenario | Best Practice |
| --- | --- |
| **FC generics** | `const Table = <T,>(props: TableProps<T>) => {}` |
| **Props default values** | Use destructuring + default, not `defaultProps` |
| **Event types** | `onChange={(e: React.ChangeEvent<HTMLInputElement>)=>…}` |
| **Avoid `React.FC`** | Does not auto-inject `children`, more precise types |

---

## 9 Error Handling & Result Pattern

```ts
type Result<T, E = Error> = { ok: true; data: T } | { ok: false; error: E };

async function fetchUser(id: string): Promise<Result<User>> { … }
```

- Frontend can destructure with `if (result.ok)`.
- Backend (NestJS, Express) can use `zod` / `io-ts` for input validation and type inference.

---

## 10 Testing & Type Tests

- **Vitest/Jest + ts-jest**: Keep tests type-safe.
- **Expect compile failure**: Use `@ts-expect-error` to test boundaries.
- Write "type tests" for complex types:

    ```ts
    type _ = Assert<Equal<ReturnType<typeof foo>, ExpectedType>>;
    ```

---

## 11 Build & Toolchain

| Tool | Notes |
| --- | --- |
| **ts-node/tsx** | For dev scripts only, use `node –r sucrase/register` or transpile for production |
| **ESBuild / SWC** | Fast; only transpiles syntax, does not check types → CI still needs `tsc --noEmit` |
| **Bun** | Good for Serverless/Edge; also enable strict mode |

---

## 12 Interoperability with JavaScript

- **`allowJs: false`**: Try to disable in new repos; if gradual migration is needed, enable incrementally.
- Declare third-party untyped libraries: `declare module 'legacy-lib'`.

---

## 13 Publishing Libraries (NPM / Private Registry)

1. **Separate types and output**: `dist/` only contains compiled JS + `.d.ts`.
2. **`exports` field**:

    ```ts
    "exports": {
      ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" }
    }
    ```

3. **Avoid `ts-node` module resolution traps**: Keep paths consistent.

---

## 14 Performance & DX

- **Avoid enums** on frontend due to bundle size; use `as const` objects instead.
- **Only use `any`/`unknown` at boundaries**, and immediately normalize to precise types.
- **Don't overuse `Omit<T, K>`**—it may indicate a model design issue.

---

## 15 Migration Strategy (JS → TS)

1. Use `// @ts-check` + JSDoc type annotations to get used to error prompts.
2. Gradually convert to `.ts`, phase by directory/module.
3. Strict mode can be relaxed at first, but must be enabled at the end of each phase.

---

## 16 CI / Code Review Checklist

- [ ]  `pnpm type-check` / `turbo type-check` passes
- [ ]  eslint/prettier passes
- [ ]  New shared types are written in `types/`, no circular dependencies
- [ ]  No `any` in public API
- [ ]  Unit/type tests cover new logic
- [ ]  Major PRs enable **"generate .d.ts diff"** (api-extractor) for review

---

## 17 Common Pitfalls Quick Reference

| Pitfall | Improvement |
| --- | --- |
| `JSON.parse` returns `any` directly | Use `zod.parse(JSON.parse(raw))` |
| `Object.keys()` inferred as `string[]` | `const keys = Object.keys(obj) as (keyof typeof obj)[]` |
| `forEach` + `await` | Use `for … of` or `Promise.all` instead |
| `.map(async …)` ignores return value | `await Promise.all(...)` |

### `Number`, `String`, `Boolean`, `Symbol` and `Object`

❌ **Don’t** ever use the types `Number`, `String`, `Boolean`, `Symbol`, or `Object`. These types refer to non-primitive boxed objects that are almost never used appropriately in JavaScript code.

```ts
/* WRONG */
function reverse(s: String): String;
```

✅ **Do** use the types `number`, `string`, `boolean`, and `symbol`.

```ts
/* OK */
function reverse(s: string): string;
```
