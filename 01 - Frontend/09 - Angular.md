# RXJS

- powerful library for reactive programming using Observables, making it easier to compose asynchronous and event-based programs.
- An `Observable` represents a stream of data that can emit multiple values over time, synchronously or asynchronously. It's 'lazy' – nothing happens until someone subscribes to it.
- A `Subject` is a special type of `Observable` that acts as both an `Observable` and an `Observer`. This means it can both emit values (like an `Observable`) and receive values (like an `Observer`). This makes `Subjects` ideal for multicasting, where you want to push values to multiple subscribers.

# How do you manage state in a large Angular application?

- LOCAL COMPONENT STATE; @input @output
- shared service state - rxjs subject, subscribe to observables
- centralized as NgRx

# optmization

- change detection, onpush
- bundle size oiptmization
- lazy load module
- caching data
- lazy load iamges
- compression befopre deployment
- modern image fdormat like webP,
- CDN
- TrackBy with ngFor, precent unnessary DOM re-rendering
- virtual scrolling and paging
- web workers
- debouncing, reduce frequency of API calls
- minimize DOM manipulation,

# **Decorators:**

- **Definition:** Decorators are a special kind of declaration that can be attached to classes, methods, accessors, properties, or parameters. They are functions that add metadata to an existing class or member, often used for configuration or behavior modification.
- compoennt, injhectable, input, output

# Angular Lifecycle Hooks

- **`ngOnChanges(changes: SimpleChanges)`:** Called when any data-bound `@Input()` property changes. Receives `SimpleChanges` object with current and previous values. Use for reacting to input changes.
- **`ngOnInit()`:** Called once after the component's data-bound properties have been initialized (after the first `ngOnChanges`). Ideal for initial data fetching, complex initialization logic, or setting up subscriptions.
- **`ngDoCheck()`:** Called during every change detection cycle. Use for implementing custom change detection logic or checking mutable objects that `ngOnChanges` wouldn't catch (use with caution, can be performance-intensive).
- **`ngAfterContentInit()`:** Called once after content projected into the component's `<ng-content>` has been initialized.
- **`ngAfterViewInit()`:** Called once after the component's view and its child views have been initialized. Use for direct DOM manipulation or accessing `@ViewChild`/`@ViewChildren` elements.
- **`ngOnDestroy()`:** Called just before the component is destroyed. Essential for cleanup: unsubscribing from Observables, detaching event listeners, clearing timers, to prevent memory leaks.

# What are Angular Services and Dependency Injection? Why are they important?"

**Answer Outline:**

- **Angular Services:**
    - **Definition:** Plain TypeScript classes decorated with `@Injectable()`. They encapsulate business logic, data fetching, or any functionality that needs to be shared across multiple components or other services.
    - **Purpose:** Promote separation of concerns (keeping components lean, focusing on UI), code reusability, and maintainability.
- **Dependency Injection (DI):**
    - **Definition:** A design pattern where a class receives its dependencies from external sources rather than creating them itself. Angular has its own DI system.
    - **How it works in Angular:**
        1. **Provider:** You register a service (or other dependency) with an Injector (e.g., `providedIn: 'root'`, in `AppModule`, or component-level).
        2. **Injector:** Angular's DI system has a hierarchical tree of injectors. When a component/service needs a dependency, the injector tree searches for a registered provider.
        3. **Injection:** Angular's DI system creates an instance of the dependency (if one doesn't already exist for that injector) and "injects" it into the constructor of the requesting class.
    - **Why Important (Benefits):**
        - **Testability:** Easy to mock dependencies for unit testing.
        - **Maintainability:** Promotes modularity and loose coupling.
        - **Reusability:** Services can be reused across the application.
        - **Scalability:** Easier to manage complex applications by breaking them into smaller, injectable pieces.