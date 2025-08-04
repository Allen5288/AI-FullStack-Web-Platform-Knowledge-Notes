<https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/hexagonal-architecture.html>

<https://infosecwriteups.com/mastering-clean-code-in-node-js-with-hexagonal-architecture-ports-adapters-e3a343a8c649>

## When

- Lots input and output, want to decouple
- This pattern is useful for creating loosely coupled business logic and infrastructure code for AWS Lambda functions that require integration with external services.
- Your application requires multiple input providers and output consumers, and customizing the application logic leads to code complexity and lack of extensibility.

## Core concept

- Whatever adapter you change, the application and port do not change
- Results in easily exchangeable application components such as databases, UX, and service components.
- Works especially well with domain-driven design (DDD), Each application component represents a sub-domain in DDD. Multiple types of clients can use the same domain logic.

## Pros

- Testability (uses abstractions for inputs and outputs. separate business logic from infrastructure code. This separation enables unit testing of the business logic without any dependencies on the database code)
- Maintainability (if the application component requires several input sources and output destinations to write to, or when the inputs and output data store has to change over time. )
- Flexibility

## Cons

- Code complexity
- Complexity locally
- Performance (Using ports and adapters adds another layer, which might result in latency.)
