# 1. microserice vs monolithic

| **Aspect**                 | **Microservices Architecture**                                                                                                                                                                                                                               | **Monolithic Architecture**                                                                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Structure**              | Decoupled, independent services (e.g., user service, payment service) with their own tech stacks.                                                                                                                                                            | Single, unified codebase with all functionality (UI, business logic, data access) tightly integrated.                                                                                                                             |
| **Scalability**            | **Pros**: Scales granularly—only high-traffic services (e.g., a messaging service) are scaled.**Cons**: Complex to manage distributed scaling; requires orchestration tools (e.g., Kubernetes).                                                              | **Pros**: Simple to scale initially—scale the entire application with load balancers.**Cons**: Inefficient for uneven traffic (scaling the whole app wastes resources for low-traffic components).                                |
| **Development Speed**      | **Pros**: Teams can work in parallel on separate services; faster iterations for isolated features.**Cons**: Coordination overhead (API design, service contracts); longer initial setup.                                                                    | **Pros**: Faster to develop initially—no need for inter-service communication; simpler onboarding for new developers.**Cons**: Slower as the app grows—codebase becomes large and hard to navigate; deployments block each other. |
| **Technology Flexibility** | **Pros**: Services can use different tech stacks (e.g., Python for ML, Node.js for APIs) based on needs.**Cons**: Increases operational complexity; harder to standardize tools/practices.                                                                   | **Pros**: Uniform tech stack simplifies training, debugging, and maintenance.**Cons**: Locked into a single stack—hard to adopt new technologies without rewriting the entire app.                                                |
| **Fault Isolation**        | **Pros**: Failures are contained (e.g., a payment service crash won’t take down the entire app).**Cons**: Distributed systems introduce new failure points (e.g., network latency, service timeouts).                                                        | **Pros**: Fewer moving parts—simpler to debug initial issues.**Cons**: A single bug or failure can crash the entire application.                                                                                                  |
| **Deployment**             | **Pros**: Independent deployment of services (reduces downtime risk); enables continuous delivery.**Cons**: Requires robust CI/CD pipelines; risk of breaking changes in inter-service APIs.                                                                 | **Pros**: Simple deployment process initially—single build and deploy step.**Cons**: Deployments are all-or-nothing; riskier for large apps (a small change requires redeploying the entire app).                                 |
| **Testing**                | **Pros**: Unit and integration testing for individual services is straightforward.**Cons**: End-to-end testing is complex (requires simulating interactions between multiple services).                                                                      | **Pros**: End-to-end testing is simpler—tests run against a single codebase.**Cons**: Slow test suites as the app grows; small changes may require re-testing the entire system.                                                  |
| **Cost**                   | **Pros**: Optimizes resource usage (scale only what’s needed).**Cons**: Higher infrastructure and operational costs (managing multiple services, databases, and tools).                                                                                      | **Pros**: Lower initial costs—fewer servers, simpler infrastructure, and smaller DevOps teams.**Cons**: Wastes resources at scale (over-provisioning to handle peak loads for one component).                                     |
| **Team Structure**         | **Pros**: Aligns with small, cross-functional teams (e.g., “feature teams” owning a service end-to-end).**Cons**: Requires strong communication between teams to avoid duplication of effort.                                                                | **Pros**: Works well for small teams—clear ownership of the entire codebase.**Cons**: Becomes siloed as the team grows—hard to divide work without overlapping responsibilities.                                                  |
| **Data Management**        | **Pros**: Each service can have its own database (optimized for its use case, e.g., SQL for transactions, NoSQL for analytics).**Cons**: Data consistency is harder to maintain across services (requires distributed transactions or eventual consistency). | **Pros**: Centralized database simplifies data consistency and queries.**Cons**: Schema changes affect the entire app; hard to optimize for diverse data needs (e.g., mixing relational and unstructured data).                   |

# 2. Strategies for handling high concurrency

- **Stateless Application Design:**
    - Make your application services stateless wherever possible. This means they don't store session-specific data in memory. —- Allows for easy horizontal scaling
- Horizontal Scaling:
    - load balancing, auto scaling
- caching
    - Im memory, distruvbuted caching(Redis), CDN(Cloudfront)
- Asynchronous Processing & Message Queues:
    - dEcoupling, using message queue(AWS SQS)
- DataBase optimization & scaling
    - indexing, read replicas
    - connection pooling
    - sharding / partitioning
    - dabase choose for specialized

# **3. Key benefits and potential drawbacks of adopting an EDA, especially when rebuilding existing tools?**

"An event-driven architecture (EDA) is a design pattern where system components communicate by producing and consuming events. Instead of one service directly calling another (a synchronous request-response model), a service produces an 'event'—a message describing something that happened—and sends it to an event bus or message broker.

- A Service does not call B service and C service, it just ppush a M event into message queue
- B and C service subvscribe to the M event, when they see the M event, the react independently

**Key Benefits:**

- **Loose Coupling and Scalability:** Services communicate asynchronously through events, so they don't need direct knowledge of each other. This makes the system incredibly flexible. You can update, deploy, or scale a single service (e.g., an invoice processing service) without impacting others (e.g., a notification service). This is crucial for a growing "house of brands" like T-shirt Ventures57. My experience with AWS services like SQS, SNS, and Lambda is directly applicable here585858.
- **Resilience and Fault Tolerance:** If one microservice fails, the rest of the system can often continue to function. The event bus (like SQS) can hold events until the failed service recovers, preventing data loss and improving overall system uptime.
- **Responsiveness:** For the user, tasks can be offloaded to background processes immediately. For example, when a user uploads a document, the system can instantly return a "processing" status while events trigger backend services for validation, storage, and analysis, leading to a much better user experience.

**Potential Drawbacks:**

- **Complexity in Debugging and Monitoring:** Tracing a single user request across multiple asynchronous services and event buses can be complex. It requires robust structured logging, correlation IDs to track a request's journey, and integrated monitoring tools like AWS X-Ray, which I have experience with59.
- **Eventual Consistency:** Since data is propagated through events, the system is not instantly consistent. It takes time for an event to be processed by all relevant services. This requires a shift in mindset and careful design to manage data consistency, especially when migrating from a monolithic, transactional system.
- **Difficult Local Development/Testing:** Replicating a complex, cloud-based event-driven architecture on a local machine can be challenging. This requires well-defined testing strategies, including unit tests for business logic, integration tests with mocked event services, and end-to-end tests in a dedicated staging environment60606060. My experience implementing comprehensive test strategies with Jest and Cypress is vital for mitigating this61616161.

## **4. What are the key considerations when designing a resilient and fault-tolerant event-driven system on AWS?**

Building on the previous question, the key considerations for resilience and fault tolerance are:

1. **Decoupling with Queues and Topics:** The foundation of resilience is decoupling. Using SQS queues between services means that if a consumer service goes down, the producer can continue to publish events to the queue without interruption98. The queue acts as a buffer, and the consumer can process the backlog once it comes back online.
2. **Retries and Exponential Backoff:** Network glitches and transient failures are inevitable. All service-to-service communication and event processing logic must have a built-in retry mechanism. This should be implemented with exponential backoff and jitter to avoid overwhelming a struggling service with a "thundering herd" of retries. AWS Lambda's integration with SQS has this retry behavior built-in.
3. **Dead-Letter Queues (DLQs):** As mentioned, every SQS queue should have a DLQ configured. This is non-negotiable for fault tolerance. It ensures that "poison pill" messages (events that consistently fail to be processed) are isolated for later analysis, rather than blocking the queue or being lost forever.
4. **Idempotent Consumers:** Services that consume events must be designed to be idempotent. They might receive the same event more than once due to retry mechanisms. The service logic must handle this gracefully without causing duplicate data or incorrect side effects.
5. **Health Checks and Monitoring:** You cannot have resilience without visibility. Implementing comprehensive monitoring and health checks is critical. I would use:
    - **CloudWatch Alarms:** Set up alarms for key metrics like the number of messages in a DLQ, high Lambda error rates, or high latency.
    - **AWS X-Ray:** To get a full trace of how an event flows through the system, which is invaluable for debugging failures in complex workflows99.
    - **Structured Logging:** Every Lambda function should output structured JSON logs with a correlation ID to trace the journey of a single event across multiple services100100100100.
6. **Per-Function IAM Roles (Least Privilege):** From a security and resilience perspective, if one service is compromised, its blast radius is limited by its specific IAM role101. It cannot affect other parts of the system for which it has no permissions. This containment is a form of fault isolation.