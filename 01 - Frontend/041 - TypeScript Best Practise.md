## 1. General Types

### 1.1 `Number`, `String`, `Boolean`, `Symbol` and `Object`

❌ **Don’t** ever use the types `Number`, `String`, `Boolean`, `Symbol`, or `Object` These types refer to non-primitive boxed objects that are almost never used appropriately in JavaScript code.

```tsx
/* WRONG */
function reverse(s: String): String;
```

✅ **Do** use the types `number`, `string`, `boolean`, and `symbol`.

```tsx
/* OK */
function reverse(s: string): string;
```

Instead of `Object`, use the non-primitive `object` type ([added in TypeScript 2.2](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#object-type)).

### 1.2 Generics

❌ **Don’t** ever have a generic type which doesn’t use its type parameter. See more details in [TypeScript FAQ page](https://github.com/Microsoft/TypeScript/wiki/FAQ#why-doesnt-type-inference-work-on-this-interface-interface-foot--). （when you define a <T> but not use it in the function, it may have problem）

### 1.3 any

❌ **Don’t** use `any` as a type unless you are in the process of migrating a JavaScript project to TypeScript. The compiler *effectively* treats `any` as “please turn off type checking for this thing”. It is similar to putting an `@ts-ignore` comment around every usage of the variable. This can be very helpful when you are first migrating a JavaScript project to TypeScript as you can set the type for stuff you haven’t migrated yet as `any`, but in a full TypeScript project you are disabling type checking for any parts of your program that use it.

In cases where you don’t know what type you want to accept, or when you want to accept anything because you will be blindly passing it through without interacting with it, you can use [`unknown`](https://www.typescriptlang.org/play/#example/unknown-and-never).

- Use `unknown` Over `any` for Flexibility with Type Safety

```tsx
let inputData: unknown = fetchData();

// Type-check before use
if (typeof inputData === 'string') {
    console.log(inputData.toUpperCase());
}
```

### 1.4 Using Enum

You can use enums to define a set of named constants and define standards that can be reused in your code base. We recommend that you export your enums one time at the global level, and then let other classes import and use the enums. Assume that you want to create a set of possible actions to capture the events in your code base. TypeScript provides both numeric and string-based enums. The following example uses an enum.

```tsx
enum EventType {
    Create,
    Delete,
    Update
}

class InfraEvent {
    constructor(event: EventType) {
        if (event === EventType.Create) {
            // Call for other function
            console.log(`Event Captured :${event}`);
        }
    }
}

let eventSource: EventType = EventType.Create;
const eventExample = new InfraEvent(eventSource)
```

### 1.5 Using Interfaces

An interface is a contract for the class. If you create a contract, then your users must comply with the contract. 

- avoid empty interface, otherwise it will have no restriction
- Use interfaces when defining objects, especially when you expect objects to have a consistent shape that could benefit from inheritance or future extension.

```tsx
import { Stack, App } from "aws-cdk-lib";
import { Construct } from "constructs";

interface BucketProps {
    name: string;
    region: string;
    encryption: boolean;

}

class S3Bucket extends Stack {
    constructor(scope: Construct, props: BucketProps) {
        super(scope);
        console.log(props.name);

    }
}
const app = App();
const myS3Bucket = new S3Bucket(app, {
    name: "amzn-s3-demo-bucket",
    region: "us-east-1",
    encryption: false
})
```

- **Type**: Use types for unions or creating more complex data structures where you don’t need extension.

```tsx
type Status = "active" | "inactive" | "pending";
```

### 1.6 Extend Interface

```tsx
 interface BaseInterface{
    name: string;
  }
  interface EncryptedVolume extends BaseInterface{
      keyName: string;
  }
  interface UnencryptedVolume extends BaseInterface {
      tags: string[];
  }
```

### 1.7 Using Utility Types

- Partial<Type>: marks all members of an input type `Type` as optional.
- Required<Type>: opposite to partial

## 1.8 Embrace `readonly` for Immutable Data Structures

```tsx
**interface User {
    readonly id: string;
    name: string;
}

const user: User = { id: '123', name: 'Alice' };
// user.id = '456';  // Error: Cannot assign to 'id' because it is a read-only property**
```

## 1.9 **Use Union and Intersection Types for Flexible Type Definitions**

Union types work well for defining a variable that could be one of several types

Intersection types combine multiple types into one.

## 1.10 **Limit Type Assertions and Use Them Judiciously**

Type assertions (`as` keyword) override TypeScript’s type system, often masking potential errors. Use them sparingly and only when necessary.

```tsx
const inputElement = document.querySelector('.input') as HTMLInputElement;
inputElement.value = 'Hello';
```

Type assertions can lead to runtime errors if used improperly, so always validate type assumptions beforehand.

## 2. Callback Types

### 2.1 Return Types of Callbacks

❌ **Don’t** use the return type `any` for callbacks whose value will be ignored:

```tsx
/* WRONG */
function fn(x: () => any) {
  x();
}
```

✅ **Do** use the return type `void` for callbacks whose value will be ignored:

```tsx
/* OK */
function fn(x: () => void) {
  x();
}
```

❔ **Why:** Using `void` is safer because it prevents you from accidentally using the return value of `x` in an unchecked way:

```tsx
function fn(x: () => void) {
  var k = x(); // oops! meant to do something else
  k.doSomething(); // error, but would be OK if the return type had been 'any'
}
```

### 2.2 Optional Parameters in Callbacks

❌ **Don’t** use optional parameters in callbacks unless you really mean it:

```tsx
/* WRONG */
interface Fetcher {
  getObject(done: (data: unknown, elapsedTime?: number) => void): void;
}
```

This has a very specific meaning: the `done` callback might be invoked with 1 argument or might be invoked with 2 arguments. The author probably intended to say that the callback might not care about the `elapsedTime` parameter, but there’s no need to make the parameter optional to accomplish this — it’s always legal to provide a callback that accepts fewer arguments.

✅ **Do** write callback parameters as non-optional:

```tsx
/* OK */
interface Fetcher {
  getObject(done: (data: unknown, elapsedTime: number) => void): void;
}
```

### 2.3 Overloads and Callbacks

❌ **Don’t** write separate overloads that differ only on callback arity:

```tsx
/* WRONG */
declare function beforeAll(action: () => void, timeout?: number): void;
declare function beforeAll(
  action: (done: DoneFn) => void,
  timeout?: number
): void;
```

✅ **Do** write a single overload using the maximum arity:

```tsx
/* OK */
declare function beforeAll(
  action: (done: DoneFn) => void,
  timeout?: number
): void;
```

❔ **Why:** It’s always legal for a callback to disregard a parameter, so there’s no need for the shorter overload. Providing a shorter callback first allows incorrectly-typed functions to be passed in because they match the first overload.

## 3. Function Overloads

### 3.1 Ordering

❌ **Don’t** put more general overloads before more specific overloads:

```tsx
/* WRONG */
declare function fn(x: unknown): unknown;
declare function fn(x: HTMLElement): number;
declare function fn(x: HTMLDivElement): string;
var myElem: HTMLDivElement;
var x = fn(myElem); // x: unknown, wat?
```

✅ **Do** sort overloads by putting the more general signatures after more specific signatures:

```tsx
/* OK */
declare function fn(x: HTMLDivElement): string;
declare function fn(x: HTMLElement): number;
declare function fn(x: unknown): unknown;
var myElem: HTMLDivElement;
var x = fn(myElem); // x: string, :)
```

❔ **Why:** TypeScript chooses the *first matching overload* when resolving function calls. When an earlier overload is “more general” than a later one, the later one is effectively hidden and cannot be called.

### 3.2 Use Optional Parameters

❌ **Don’t** write several overloads that differ only in trailing parameters:

```tsx
/* WRONG */
interface Example {
  diff(one: string): number;
  diff(one: string, two: string): number;
  diff(one: string, two: string, three: boolean): number;
}
```

✅ **Do** use optional parameters whenever possible:

```tsx
/* OK */
interface Example {
  diff(one: string, two?: string, three?: boolean): number;
}
```

Note that this collapsing should only occur when all overloads have the same return type.

❔ **Why:** This is important for two reasons.

TypeScript resolves signature compatibility by seeing if any signature of the target can be invoked with the arguments of the source, *and extraneous arguments are allowed*. This code, for example, exposes a bug only when the signature is correctly written using optional parameters:

```tsx
function fn(x: (a: string, b: number, c: number) => void) {}
var x: Example;
// When written with overloads, OK -- used first overload
// When written with optionals, correctly an error
fn(x.diff);
```

The second reason is when a consumer uses the “strict null checking” feature of TypeScript. Because unspecified parameters appear as `undefined` in JavaScript, it’s usually fine to pass an explicit `undefined` to a function with optional arguments. This code, for example, should be OK under strict nulls:

```tsx
var x: Example;
// When written with overloads, incorrectly an error because of passing 'undefined' to 'string'
// When written with optionals, correctly OK
x.diff("something", true ? undefined : "hour");
```

### 3.3 Use Union Types

❌ **Don’t** write overloads that differ by type in only one argument position:

```tsx
/* WRONG */
interface Moment {
  utcOffset(): number;
  utcOffset(b: number): Moment;
  utcOffset(b: string): Moment;
}
```

✅ **Do** use union types whenever possible:

```tsx
/* OK */
interface Moment {
  utcOffset(): number;
  utcOffset(b: number | string): Moment;
}
```

Note that we didn’t make `b` optional here because the return types of the signatures differ.

❔ **Why:** This is important for people who are “passing through” a value to your function:

```tsx
function fn(x: string): Moment;
function fn(x: number): Moment;
function fn(x: number | string) {
  // When written with separate overloads, incorrectly an error
  // When written with union types, correctly OK
  return moment().utcOffset(x);
}
```

## 4. Design Mode

### **4.1 Use factories**

In an Abstract Factory pattern, an interface is responsible for creating a factory of related objects without explicitly specifying their classes. For example, you can create a Lambda factory for creating Lambda functions. Instead of creating a new Lambda function within your construct, you're delegating the creation process to the factory. For more information on this design pattern, see [Abstract Factory in TypeScript](https://refactoring.guru/design-patterns/abstract-factory/typescript/example) in the Refactoring.Guru documentation.

## 5. Class Function

- Adding Access modifiers(private, public, protect(only in class and subclass))

## 6. Configuration

- strict configuration

```tsx
{
  "forceConsistentCasingInFileNames": true,
  "noImplicitReturns": true,
  "strict": true,
  "noUnusedLocals": true,
}
```

## 7. **Document Types and Functions for Better Collaboration**

Good documentation enhances readability, especially in team projects. Use JSDoc comments to explain types and functions, making it easier for others to understand and work with your code.

```tsx
/**
 * Calculates the area of a circle
 * @param radius - The radius of the circle
 * @returns The calculated area
 */
function calculateArea(radius: number): number {
    return Math.PI * radius * radius;
}
```

## 50. Other small tips

- Using destucturing on properties

```tsx
const object = {
    objname: "obj",
    scope: "this",
};

const oName = object.objname;
const oScop = object.scope;

const { objname, scope } = object;
```

- **Define standard naming conventions**
- **Don't use the var keyword**
- **Using ESLint and Prettier**
- using === instead of ==
- Leverage Type Inference, But Define Explicit Types Where Needed
- Handle Null and Undefined Safely (Types like `null` and `undefined` often cause runtime errors if not handled properly. TypeScript provides the `optional chaining` (`?.`) and `nullish coalescing` (`??`) operators to handle these cases gracefully.)

```tsx
const userName = user?.profile?.name ?? "Guest";
```

- **Use never for Exhaustive Checks(**When working with union types, use `never` to ensure exhaustive checking in `switch` cases. This ensures that if new cases are added to the union, TypeScript will throw an error if they are not handled.**)**

```tsx
type Shape = Circle | Square | Triangle;

function getArea(shape: Shape) {
  switch (shape.type) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side * shape.side;
    default:
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}
```