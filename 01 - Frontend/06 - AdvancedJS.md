### **1. What are generators in JavaScript and how do they work? Provide an example of using generators to iterate over an infinite sequence.**

Generators are functions that can pause and resume their execution, allowing for more complex control flows. They are defined using the `function*` syntax and yield values using the `yield` keyword. Example:

```
function* infiniteSequence() {
  let i = 0;
  while (true) {
    yield i++;
  }
}
const generator = infiniteSequence();
console.log(generator.next().value);// Outputs: 0
console.log(generator.next().value);// Outputs: 1

```

### **2. Explain the concept of currying in JavaScript and how it can be implemented. Provide an example.**

Currying is the process of converting a function that takes multiple arguments into a sequence of functions that each take a single argument. It can be implemented using nested functions or by using libraries like Lodash. Example:

```

function multiply(a) {
  return function (b) {
    return a * b;
  };
}
const multiplyByTwo = multiply(2);
console.log(multiplyByTwo(3));// Outputs: 6

```

### **3. What are some common performance optimizations for JavaScript code?**

Common performance optimizations for JavaScript code include minimizing DOM manipulation, reducing function calls inside loops, using efficient data structures, caching results of expensive computations, and avoiding unnecessary reflows and repaints.

### **4. Explain the concept of event bubbling and event capturing in JavaScript. How can you prevent event bubbling?**

Event bubbling is the propagation of an event from the target element up through its ancestors in the DOM tree, while event capturing is the opposite, where the event is captured from the outermost element down to the target element. Event bubbling can be prevented using the `stopPropagation()` method.

### **5. What are Web Workers in JavaScript? How do they improve performance in web applications?**

Web Workers are a mechanism that allows JavaScript code to run in background threads, separate from the main execution thread of the browser. They improve performance by offloading CPU-intensive tasks to background threads, preventing blocking of the main thread.

### **6. What are the differences between shallow and deep copying in JavaScript? Provide examples.**

Shallow copying creates a new object with the same properties as the original object, while deep copying creates a new object with copies of all nested objects as well. Example:

```

// Shallow copy
const original = { a: 1, b: { c: 2 } };
const shallowCopy = { ...original };
// Deep copy
const deepCopy = JSON.parse(JSON.stringify(original));

```

### **7. What are some strategies for handling errors in JavaScript?**

Strategies for handling errors in JavaScript include using try-catch blocks, throwing custom errors, using promises and async/await for asynchronous error handling, and logging errors for debugging purposes.

### **8. What are some tools and techniques for debugging JavaScript code?**

Tools and techniques for debugging JavaScript code include using browser developer tools (such as Chrome DevTools), console logging, breakpoints, step-by-step debugging, and debugging extensions/plugins like React Developer Tools.

### **10. Explain the concept of lexical scoping in JavaScript. How does it differ from dynamic scoping?**

Lexical scoping means that the scope of a variable is determined by its location within the source code. It differs from dynamic scoping, where the scope of a variable is determined by the calling context at runtime.

### **12. Explain the concept of event-driven programming in JavaScript. Provide examples of event-driven architecture in web applications.**

Event-driven programming is a programming paradigm where the flow of the program is determined by events such as user actions, system events, or messages from other parts of the program. Examples in web applications include handling user interactions (clicks, keypresses), AJAX requests, and DOM manipulation.

### **14. What is the purpose of the `Symbol` data type in JavaScript? Provide examples of how `Symbol` values can be used.**

`Symbol` is a primitive data type introduced in ES6 that represents a unique identifier. It is often used to create private object properties, prevent naming collisions, and define well-known symbols for built-in behaviors. Example:

```

const id = Symbol('id');
const user = {
  [id]: 123,
  name: 'John'
};

```

### **15. What is the purpose of the `WeakMap` and `WeakSet` data structures in JavaScript? How do they differ from `Map` and `Set`?**

`WeakMap` and `WeakSet` are special types of collections in JavaScript that allow only objects as keys (for `WeakMap`) or values (for `WeakSet`). They hold weak references to objects, meaning that they do not prevent garbage collection of the objects they reference. This makes them useful for scenarios where objects should be automatically removed when they are no longer needed.