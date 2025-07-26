<https://react.dev/learn>

## 1. Angular Vs React

| **Feature** | **Angular** | **React** |
| --- | --- | --- |
| **Type** | Full-fledged Framework | JavaScript Library |
| **Architecture** | Component-based, often follows MVC/MVVM | Component-based |
| **Language** | Primarily TypeScript | JavaScript with JSX |
| **Data Binding** | Two-way data binding(improve efficiency but performance problem in big app) | One-way data binding |
| **DOM** | Real DOM | Virtual DOM |
| **Learning Curve** | Steeper | Easier (especially with JavaScript knowledge) |
| **Ecosystem** | Comprehensive (includes routing, HTTP, etc.) | Flexible, relies on third-party libraries |
| **Tooling** | Angular CLI | Create React App (and others) |
| **Performance** | Generally good, can be optimized(unnessary render) | Often faster due to Virtual DOM updates |
| **Usage** | Suitable for large-scale, complex applications | Ideal for building interactive UIs and SPAs |

## **2. Explain the Virtual DOM and how React uses it.**

- **Answer:** The Virtual DOM (VDOM) is a lightweight, in-memory representation of the actual browser DOM. When the state of a component changes, React creates a new VDOM tree, compares it with the previous one (diffing), and calculates the minimal number of changes needed to update the real DOM. React then updates only the necessary parts of the real DOM, which is much faster than manipulating the real DOM directly.

## **3. What are the differences between functional and class components?**

- **Class Components:** ES6 classes that extend `React.Component`. They have state and lifecycle methods.
- **Functional Components:** JavaScript functions that accept props as an argument and return JSX. Before Hooks, they were considered "stateless" and didn't have lifecycle methods. With Hooks, functional components can have state and side effects.

## **4. Explain the concept of lifting state up.**

- **Answer:** Lifting state up is a technique where the state that is shared between multiple sibling components is moved up to their closest common ancestor component. The ancestor component then manages the state and passes it down to the children via props. This ensures that the shared state is the single source of truth and keeps the data in sync across related components.

## **5. What are React Hooks? Name some common ones.**

- **Answer:** React Hooks are functions that allow you to use state and other React features (like lifecycle methods) in functional components. They were introduced in React 16.8.
- **Common Hooks:** `useState`, `useEffect`, `useContext`, `useReducer`, `useCallback`, `useMemo`, `useRef`.

### `useEffect`

- The `useEffect` Hook allows you to perform side effects in functional components. Side effects are operations that interact with the outside world or have observable effects beyond the component's rendering (e.g., data fetching, DOM manipulation, subscriptions). `useEffect` runs after every render by default, but you can control when it runs by providing a dependency array.
- Use state is synchronous, but the batchUodate make it asyn.
- Component lifecycle
  - Mounted - dependence is blank
  - Updating - take a state changed to update
  - Unmounting - when we write return in effect. return(()⇒{  })
    - clear interval, clear binding event, clear accountance resourse\
- Reduce using effect
  - derive values in render

        ```jsx
        // 无需 useEffect，直接在渲染时计算
        function MyComponent({ list }) {
          // 根据传入的 list，直接在渲染中推导出“已完成任务数量”
          const completedCount = list.filter(item => item.done).length;  
          
          // ✅ 当 items 变化时，useMemo 会重新计算并更新 totalPrice
          const totalPrice = useMemo(() => {
            return items.reduce((sum, item) => sum + item.price, 0);
          }, [items]); // 依赖 items，items 变化时重新计
          ****
          return <div>已完成：{completedCount}</div>;
        }
        ```

  - **respond to events with handlers(onclick, ..)**
  - **fetch with React Query**

        ```jsx
        // 用 React Query 替代 useEffect 发请求
        import { useQuery } from 'react-query';
        function UserList() {
        // 一行代码搞定请求、缓存、loading/error 状态
        const { data, isLoading, error } = useQuery('users', () =>
        fetch('/api/users').then(res => res.json())
        );
        if (isLoading) return <div>加载中...</div>;
        if (error) return <div>请求失败</div>;
        return <ul>{data.map(user => <li>{[user.name](http://user.name/)}</li>)}</ul>;
        }
        ```

| **Tip** | **Reason / What It Prevents** |
| --- | --- |
| ✅ Use correct dependency array | Avoids stale data or missed updates |
| ✅ Avoid unguarded `setState` inside effect | Prevents infinite render loops |
| ✅ Use cleanup functions (`return () => {}`) | Avoids memory leaks (especially with subscriptions or timeouts) |
| ✅ Don’t use `async` directly in `useEffect` | React effects can't return promises; use inner function instead |
| ✅ Debounce inputs before triggering effects | Improves performance and reduces API calls |
| ✅ Avoid side effects in render body | Keeps rendering pure and predictable |
| ✅ Use `useRef` for stable values | Prevents unnecessary re-renders caused by changing references |
| ✅ Use functional `setState((prev) => ...)` if depending on previous state | Avoids issues with stale closures |
| ✅ Use lint rules (`eslint-plugin-react-hooks`) | Helps catch missing dependencies and logic errors automatically |

### **`useReducer`**

- **What it is:** A Hook that provides an alternative way to manage state in functional components.
- **What it does:** It's typically used for managing more complex state logic where the next state depends on the previous state, or when state updates involve multiple sub-values. It works by taking a `reducer` function (which determines how state changes based on actions) and an initial state. It returns the current state and a `dispatch` function to trigger state updates by dispatching actions.
- **When to use it:** When you have complex state transitions, when state logic is spread across many event handlers, or when state management feels more predictable with a Flux/Redux-like pattern.
- **Key Benefit:** Provides a structured and testable way to handle complex state updates compared to multiple `useState` calls.

### **`useContext`**

- **What it is:** A Hook for subscribing to React Context.
- **What it does:** It allows a functional component to read the current value of a Context that was provided by a `Context.Provider` higher up in the component tree. It subscribes the component to the context changes, so if the context value changes, the component will re-render. It replaces the older `Context.Consumer` component API.
- **When to use it:** When you need to access shared data (like themes, authenticated user info, or locale) across multiple components at different nesting levels without passing props down manually through every intermediate component (avoiding "prop drilling").
- **Key Benefit:** Simplifies component trees and avoids prop drilling for accessing shared, application-wide (or subtree-wide) values.

### **`useMemo`**

- **What it is:** A Hook for memoization.
- **What it does:** It memoizes a calculated value. It takes a "create" function and a dependency array. It runs the "create" function only when one of the dependencies in the array changes. Otherwise, it returns the *cached* value from the last render. This prevents expensive calculations from running on every single render.
- **When to use it:** When you have computationally expensive calculations or data transformations within your component's render logic, and you want to avoid re-running them unnecessarily on every render when the relevant inputs haven't changed.
- **Key Benefit:** Performance optimization by preventing repetitive, costly computations.
- Different of useMemo and useCallback?
  - one is for variable, one is for function, for the cache.

### **`useRef`**

- **What it is:** A Hook for creating a mutable reference object.
- **What it does:** It returns a mutable ref object whose `.current` property is initialized to the passed argument (`initialValue`). The key characteristic is that updating the `.current` property *does not* cause a re-render, and the value of `.current` persists across renders.
- **When to use it:**
  - To access and interact with DOM nodes directly (e.g., focusing an input, measuring dimensions).
  - To store any mutable value that needs to persist across renders but doesn't need to trigger re-renders when it changes (e.g., storing a timer ID, keeping track of a previous value, storing a flag like `isMounted`).
- **Key Benefit:** Provides a way to store mutable values in functional components that persist across renders without causing the component to update, useful for interacting with imperative APIs or holding values outside the render cycle.

## 6. Rendering

### 6.1 The purpose of keys when rendering lists?

1. **Track identity**: Keys uniquely identify each element in a list, allowing React to match elements between renders.
2. **Preserve state**: Without keys, React may reorder or remount components unnecessarily, causing issues like lost input values or broken animations.
3. **Optimize performance**: Efficiently update only the elements that have actually changed.
4. Key Probelm
    1. Using Index - List is dynamic, key will be reused
    2. using uuid

### 6.2 How to render things outSide of root

- Create a target DOM Node outside of root
- Use ReactDOM.createPortal() in a component

```jsx
<!-- index.html -->
<body>
<!-- Main React root -->
<div id="root"></div>
<!-- Target for portal (outside root) -->
<div id="portal-root"></div>
</body>
```

```jsx
import React from'react';
import ReactDOM from'react-dom';

// Component that renders outside the root tree
const PortalElement = ({ children }) => {
  // Get the portal-root DOM node
  const portalRoot = document.getElementById('portal-root');
  
  // Render children into portal-root
  return ReactDOM.createPortal(
    <div className="portal-content">
      {children}
    </div>,
    portalRoot // Target DOM node
  );
};

// Usage in a parent component
const ParentComponent = () => {
  const [showPortal, setShowPortal] = React.useState(false);

  return (
    <div className="parent-container" style={{ overflow: 'hidden', padding: '20px' }}>
      <h1>Main App (Inside Root)</h1>
      <button onClick={() => setShowPortal(true)}>
        Show Element Outside Root
      </button>

      {showPortal && (
        <PortalElement>
          <div style={{ position: 'fixed', }}>
            <h2>I'm outside the root!</h2>
            <button onClick={() => setShowPortal(false)}>Close</button>
          </div>
        </PortalElement>
      )}
    </div>
  );
};

export default ParentComponent;
```

## **7. What are Higher-Order Components (HOCs)?**

- **Answer:** A Higher-Order Component is a design pattern where a function takes a component as an argument and returns a *new* component with enhanced functionality. HOCs are used for code reuse, logic abstraction, and cross-cutting concerns like authentication, logging, or data fetching. They don't modify the original component but rather wrap it.
  - typical start the keyword with

## **8. Explain controlled and uncontrolled components in React forms.**

- **Controlled Components:** Form elements (like `<input>`, `<textarea>`, `<select>`) whose values are controlled by the component's state. The state is the single source of truth, and every state update re-renders the component. This allows for features like input validation and conditional submission.
- **Uncontrolled Components:** Form elements whose values are managed by the DOM itself. You access their values using refs. They are simpler to implement for basic forms but offer less control over data flow and validation.

## 9. Common Options to Store Session Data

| Storage | Lives Until | Accessible by | Use Case |
| --- | --- | --- | --- |
| `sessionStorage` | Tab is closed | Client-side JS | Temporary session data |
| `localStorage` | Manually cleared or via JS | Client-side JS | User login info, theme |
| **React Context** / State | While React app is mounted | React only | UI state (e.g. modals) |
| **Cookies** | Set by server or client | Server + client | Auth/session tokens |
| **Redux or Zustand** | App lifetime | React only | Global state, synced storage |
| Encrypted storage (via `secure-ls`, etc.) | Depends | JS + security layer | Sensitive info like tokens |

Tips for Best Practice

- Avoid storing **JWT tokens** in `localStorage`/`sessionStorage` (vulnerable to XSS) unless it’s a public app with limited security needs.
- Use **HttpOnly cookies** if you're dealing with authentication and sensitive session data.
- Use a **global store (e.g. Zustand, Redux)** if you want state across multiple components that resets when the tab closes.

## 10. Data Transfer & management

### 10.1 Transit data from child to parent

- callback function
- context, redux

### 10.2 store method

- context, redux, zustand

### 10.3 State management solution

- For simple applications, relying on a component's **local state** and **passing props down** is the cleanest approach. It's easy to understand and requires no external libraries.
- When multiple, non-related components need to access or modify the same piece of data, 'prop drilling' becomes cumbersome.
  - Context(doesnot change often, user authentication status or theme information)
- Complex, frequency, independent state, Redux or zustand.

# 11. Performance

### 11.1 Lazy()

- when when only needed

Render props

custom hooks
