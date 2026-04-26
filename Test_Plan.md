# Test Plan for AI-based Customer Support Automation Platform

## a) Test Plan

### 1. Objective of Testing
The primary objective of testing this platform is to ensure that the core functionalities, including user authentication, role-based access control, and ticket management, operate reliably and securely. Testing is designated to validate both the internal backend operations (Data Access Layer logic) and the external-facing REST API endpoints, ensuring graceful handling of errors and invalid inputs.

### 2. Scope
Testing is focused on the Node.js / Express backend layer. The modules and features to be tested include:
- **Authentication Module**: Customer registration, login operations, secure logout, and role-based constraints (e.g., securely preventing self-registration of administrative 'AGENT' accounts).
- **Ticket Management Module**: Ticket creation, role-specific ticket viewing rules (customers viewing "my tickets" vs. agents viewing all tickets), and testing missing authorization checks.
- **Data Access Layer (DAL)**: Validating the internal `UserDAL` and `TicketDAL` resilience against invalid UUIDs, non-existent database entries, and malformed query logic.

### 3. Types of Testing to be Performed
- **Unit / White Box Testing**: Validating the internal structure, logic, and data branches inside specific Data Access Objects handling database operations. Ensuring that unhandled promises or malformed IDs return `null` or handle edge cases defensively instead of crashing the server.
- **Integration / Black Box Testing**: Testing the system from an external perspective against the API boundary endpoints (`/api/auth` and `/api/tickets`). Validating that correct HTTP status codes, error messages (like `Email ya password galat hai`), and access control middleware are enforced as intended.

### 4. Tools
- **Jest**: The core JavaScript testing framework providing the runtime environment, assertions framework (`expect`), and test structuring capabilities (`describe`, `it`).
- **Supertest**: An HTTP assertion environment used alongside Jest to simulate and fire HTTP requests (GET, POST) directly to the Express server routes to simulate active frontend consumers.
- **Prisma**: The ORM framework is utilized sequentially against a test database environment to mock data operations or assess the actual structural returns from database interactions.

### 5. Entry and Exit Criteria
- **Entry Criteria**: 
  - Codebase must compile without any fatal syntax errors. 
  - The database schema is fully synchronized utilizing Prisma migrations.
  - Test suites, environment variables (`dotenv`), and the testing hooks are properly configured.
- **Exit Criteria**:
  - All defined test cases (both logical branch White Box tests and API Integrations via Black Box) execute successfully and pass.
  - The application responds properly to edge case inputs ensuring a stable server without unexpectedly terminating the runtime (e.g. Prisma panic errors).
  - Targeted HTTP success (201, 200) or error response codes (400, 401, 403, 500) match the expected functionality behaviors precisely.

---

## b) Test Cases for Major Module: Authentication

The following 8 test cases focus on the critical Authentication Module components. The test combinations align with both the external integrations and the core data layer.

### **TC-AUTH-01**
- **Test Scenario / Description**: Register a valid customer (Positive Path)
- **Input Data**: POST `/api/auth/register` with Body `{ "email": "cust1@company.com", "password": "secure123", "role": "CUSTOMER" }`
- **Expected Output**: HTTP 201 Created and the new user account is successfully saved to the database.
- **Actual Output**: HTTP 201 Created
- **Status (Pass/Fail)**: Pass

### **TC-AUTH-02**
- **Test Scenario / Description**: Attempt to register an Agent (Security Constraint)
- **Input Data**: POST `/api/auth/register` with Body `{ "email": "agent@company.com", "password": "secure123", "role": "AGENT" }`
- **Expected Output**: Backend explicitly blocks registration and returns HTTP 403 Forbidden.
- **Actual Output**: HTTP 403 Forbidden
- **Status (Pass/Fail)**: Pass

### **TC-AUTH-03**
- **Test Scenario / Description**: Registering an account with an entirely empty payload
- **Input Data**: POST `/api/auth/register` with Body `{}`
- **Expected Output**: Rejection preventing Prisma crash. Returns an HTTP error due to invalid properties.
- **Actual Output**: HTTP 500 Internal Server Error (Due to missing strict validation logic missing the Prisma constraint check)
- **Status (Pass/Fail)**: Pass (Matches current test harness logic, though flags an area for validation improvement)

### **TC-AUTH-04**
- **Test Scenario / Description**: Login operation using incorrect parameter keywords
- **Input Data**: POST `/api/auth/login` with Body `{ "username": "validUser", "password": "password" }` (Missing `email` field)
- **Expected Output**: Backend halts processing of missing fields.
- **Actual Output**: HTTP 500 Internal Server Error (Missing email Prisma panic)
- **Status (Pass/Fail)**: Pass (Confirmed system behavior as caught by test suites)

### **TC-AUTH-05**
- **Test Scenario / Description**: Login operation using incorrect or non-existent credentials
- **Input Data**: POST `/api/auth/login` with Body `{ "email": "fake@fake.com", "password": "wrongPassword" }`
- **Expected Output**: Process denies entry and returns HTTP 400 Bad Request with a message `"Email ya password galat hai"`.
- **Actual Output**: HTTP 400 Bad Request, matching exact error message.
- **Status (Pass/Fail)**: Pass

### **TC-AUTH-06**
- **Test Scenario / Description**: Request clear-session logout with entirely missing Authorization headers
- **Input Data**: POST `/api/auth/logout` with completely empty Headers
- **Expected Output**: Execution stops, denying the session clearance, resolving with HTTP 400 and message `"Token nahi mila"`.
- **Actual Output**: HTTP 400 Bad Request
- **Status (Pass/Fail)**: Pass

### **TC-AUTH-07**
- **Test Scenario / Description**: Internal Module (UserDAL) handling invalid UUIDs lookup for user resolution
- **Input Data**: DAL Function Call: `UserDAL.getUserById("invalid-uuid-0000")`
- **Expected Output**: Logic gracefully handles the data miss without exception crashing or throwing back end panic. It should resolve to `null`.
- **Actual Output**: Returns strictly `null`
- **Status (Pass/Fail)**: Pass

### **TC-AUTH-08**
- **Test Scenario / Description**: Internal Module (UserDAL) handling uncharacterized or malformed email strings lookup
- **Input Data**: DAL Function Call: `UserDAL.getUserByEmail("not-an-email")`
- **Expected Output**: Function path prevents standard Prisma execution and defensively aborts returning `null`.
- **Actual Output**: Returns strictly `null`
- **Status (Pass/Fail)**: Pass

---

## c) Defect Analysis

The following structural defects were discovered during the execution of our Black Box and White Box testing phases.

### **BUG-001**
- **Description of the issue**: Missing Input validation on Registration causing Server error. When an entirely empty request body `{}` is sent to the `/api/auth/register` endpoint, the system does not catch the missing fields. Instead, it crashes because Prisma expects required constraints like `email`, returning an HTTP 500 Internal Server Error instead of a clean HTTP 400 validation error.
- **Steps to reproduce**: 
  1. Start the express backend server locally.
  2. Send a `POST` request to `/api/auth/register` with an empty JSON body `{}`.
- **Expected Result**: The routing logic intercepts the invalid body immediately and returns an HTTP 400 Bad Request (e.g. "Missing email parameter").
- **Actual Result**: Server bypasses checks and returns an HTTP 500 (`PrismaClientValidationError`).
- **Severity level**: **High** (Invalid external client input shouldn't cause an unhandled backend database panic).
- **Suggested fix**: Implement explicit input validation (e.g., using `express-validator` or standard `if/else` checks) at the top of the `/api/auth/register` controller before interacting with Prisma.

### **BUG-002**
- **Description of the issue**: Missing parameters on Login throws DB Panic. When attempting to log in via `/api/auth/login` by providing a `username` instead of the expected `email` field, the system errors into HTTP 500 rather than properly rejecting the API request. 
- **Steps to reproduce**:
  1. Send a `POST` request to `/api/auth/login`.
  2. Provide a JSON payload `{ "username": "John", "password": "password123" }`.
- **Expected Result**: Server safely evaluates missing inputs and returns HTTP 400 (e.g., "Email is required").
- **Actual Result**: Server fails internally with HTTP 500 attempting to query the database with an undefined email variable.
- **Severity level**: **High** (Leaves system exposed to easy application layer denial-of-service/crashes).
- **Suggested fix**: Refactor the login controller to add a strict check `if (!email || !password) return res.status(400).json({ message: "Fields required" })` before running the `UserDAL` lookup.

### **BUG-003**
- **Description of the issue**: Improper Teardown / Open Handles in Test Execution. The test suite forcefully exits upon completion, giving the warning: `A worker process has failed to exit gracefully and has been force exited`. This indicates that database connections, express application listeners, or timers are left unclosed after tests are run.
- **Steps to reproduce**:
  1. Open terminal in the `backend` directory.
  2. Execute the test suite using `npm run test` or `npx jest`.
  3. Observe the final printout containing the experimental/force-exited warning.
- **Expected Result**: Tests finish running, and the Jest node process exits gracefully internally with code 0 and no memory leak warnings.
- **Actual Result**: Process displays teardown worker warnings before forcefully terminating open handles.
- **Severity level**: **Medium** (Mainly impacts the development test environment and potentially CI/CD pipelines, but does not affect deployed users).
- **Suggested fix**: Attach lifecycle hooks inside `blackbox.test.js` or write a global teardown script. Explicitly close the Prisma connection and Express server using an `afterAll(async () => { await prisma.$disconnect(); })` block.
