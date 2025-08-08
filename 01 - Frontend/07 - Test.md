### Test Rules

- using getRole, getLabelText, rather than getBytestId(you should not add test id for test, not accessibility)

### How to test a Form:

- Rendering (UI elements show correctly).
- User interactions (typing, selecting, submitting).
- Validation and error messages.
- Submission logic (like calling a handler or sending data).

### difference between unit integration and E2E test?

| Feature      | Unit Test         | Integration Test         | End-to-End (E2E) Test   |
| ------------ | ----------------- | ------------------------ | ----------------------- |
| Scope        | 1 function/module | Multiple components/APIs | Whole app from UI to DB |
| Speed        | ⚡⚡⚡ Fast          | ⚡⚡ Medium                | ⚡ Slow                  |
| Dependencies | Mocked            | Some mocked              | Real backend + DB       |
| Tools        | Jest, vitest      | RTL, msw, Supertest      | Cypress, Playwright     |
| Confidence   | Low               | Medium                   | High                    |
| Cost         | Low               | Medium                   | High                    |

Best Practice (Pyramid)

> 🔺 Few E2E
> 
> 
> 🔸 More Integration
> 
> 🟢 Lots of Unit tests
>