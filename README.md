# example

This repository contains a small Spring Boot backend plus a few Angular frontends used for experimentation/demos.

## Repository layout

- **`demo/`**
  - Spring Boot (Java 17) backend.
  - Exposes a couple simple endpoints (`/hello`, `/all`) and contains tax/withdrawal optimization utilities.
- **`demo-client/`**
  - Angular frontend that calls the Spring Boot backend on `http://localhost:8081`.
  - Includes chart components (ngx-charts / chart.js wrappers) and a simple `HelloService`.
- **`hello-world/`**
  - Angular app generated with Angular CLI (includes SSR scaffolding).
- **`demo-2/`**
  - Another Angular app (angular.io example-style project).

## Backend (`demo/`) overview

### Entry point

- **`demo/src/main/java/com/example/demo/DemoApplication.java`**
  - Spring Boot application entry.
  - Starts the web server.

### REST API

Defined in **`demo/src/main/java/com/example/demo/Controller.java`**.

- **`GET /hello`**
  - Returns: plain text `"Hello, World!"`
  - CORS: allows `http://localhost:4200`
- **`GET /all`**
  - Returns: JSON array of `TaxBracket` rows (currently loaded from `demo/src/main/resources/tax-brackets.json`)
  - CORS: allows `http://localhost:4200`

### Persistence model

- **`demo/src/main/java/com/example/demo/model/TaxBracket.java`**
  - JPA entity mapped to table `tax_bracket`.
  - Fields:
    - `index` (primary key)
    - `lower_bound`, `upper_bound`, `rate`
- **`demo/src/main/java/com/example/demo/repository/TaxBracketRepository.java`**
  - `JpaRepository<TaxBracket, Integer>` used by the controller/services.

### Core calculation/optimization services

These are currently implemented as utility-style services with a lot of static methods:

- **`TaxCalculationService`**
  - Loads tax brackets from DB on startup (`@PostConstruct`).
  - `calculatePreTaxAmount(afterTaxAmount)` converts an after-tax target to a pre-tax amount by walking the bracket table.
- **`TaxMinimizationService`**
  - Brute-force/iterative search across withdrawal percentage permutations.
  - Uses `FinanceUtility` for time-to-depletion math and `TaxCalculationService` to gross-up taxable withdrawals.
- **`FinanceUtility`**
  - Independent finance helper math (years until depletion, final value with fractional years).

### Configuration

- **`demo/src/main/resources/application.properties`**
  - Server port: `8081`
  - Datasource: currently disabled (backend is file-backed for now)

- **`demo/src/main/resources/tax-brackets.json`**
  - Dummy tax bracket data used when running without a DB.

**Important:** the current `application.properties` includes credentials. For real usage, move these to environment variables (or a secrets manager) and keep them out of git history.

## Frontend (`demo-client/`) overview

### Entry point

- **`demo-client/src/main.ts`** bootstraps **`AppModule`**.

### Backend integration

- **`demo-client/src/app/services/HelloService.ts`**
  - Calls backend: `GET http://localhost:8081/hello`
  - Returns the response as `text`.

- **`demo-client/src/app/app.component.ts`**
  - On load (`ngOnInit`), subscribes to `HelloService.getServerMessage()` and prints/displays the response.

### Routing

- **`demo-client/src/app/app-routing.module.ts`**
  - Routes for `component1` and `component2` (plus auxiliary outlet routes).

## How to run

### Prerequisites

- Java 17+
- Maven (or use the included `mvnw` wrapper in `demo/`)
- Node.js + npm
- Angular CLI (optional; `npx ng ...` also works)

### Start the backend

From the repo root (PowerShell):

```powershell
./start-backend.ps1
```

Or from `demo/`:

```bash
./mvnw spring-boot:run
```

Backend should start on:

- `http://localhost:8081`

### Start the demo frontend (`demo-client/`)

From the repo root (PowerShell):

```powershell
./start-frontend.ps1
```

Run on a different port (example):

```powershell
./start-frontend.ps1 -Port 4021
```

From `demo-client/`:

```bash
npm install
npm start
```

Default Angular dev server is usually:

- `http://localhost:4200`

Then verify:

- Frontend calls `GET http://localhost:8081/hello`

### Start the other Angular apps

From either `hello-world/` or `demo-2/`:

```bash
npm install
npm start
```

## Where to look first (quick orientation)

- **Backend API**: `demo/src/main/java/com/example/demo/Controller.java`
- **DB entity & repository**: `demo/src/main/java/com/example/demo/model/TaxBracket.java`, `.../repository/TaxBracketRepository.java`
- **Tax logic**: `demo/src/main/java/com/example/demo/service/TaxCalculationService.java`, `TaxMinimizationService.java`
- **Frontend API client**: `demo-client/src/app/services/HelloService.ts`

## Notes / known rough edges

- The backend currently hardcodes/prints a lot to stdout and has some utility-style static methods; if you plan to evolve this into a production service, consider refactoring toward request/response DTOs and non-static, testable Spring services.
- CORS is currently configured per-endpoint to allow `http://localhost:4200`. If you run the frontend on a different port, you’ll need to adjust CORS.
