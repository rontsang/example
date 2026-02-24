# Backend (`demo/`) documentation

## What this service is

`demo/` is a Spring Boot (Java 17) REST backend that supports a small tax/withdrawal simulation/optimization demo.

The core flow is:

- The frontend posts an input payload describing account balances, income, and either:
  - a desired after-tax spending amount per year (optimization mode), or
  - explicit withdrawal amounts per account (simulation mode)
- The backend runs the corresponding service (`TaxMinimizationService` or `TaxSimulationService`).
- The service generates a time-series “burndown” (`ArrayList<BurndownTimeEvent>`).
- The burndown is serialized to disk at `C:\example\demo\burndown.ser`.
- API calls return the burndown list (either directly from the computed result or by reading the file).

## Runtime configuration

- **Port**: `8081` (`server.port=8081` in `src/main/resources/application.properties`)
- **Tomcat threads**: forced single-thread (`server.tomcat.max-threads=1`, `server.tomcat.min-spare-threads=1`)
- **CORS**: endpoints are annotated with `@CrossOrigin(origins = "http://localhost:4200")`

### Persistence / JPA

`application.properties` disables Spring’s datasource/JPA auto-configuration:

- `spring.autoconfigure.exclude=...DataSourceAutoConfiguration,...HibernateJpaAutoConfiguration,...DataSourceTransactionManagerAutoConfiguration`

Even though JPA repositories/entities exist in the codebase, this configuration means the app is currently set up to run **without a configured datasource**.

Also note:

- `pom.xml` includes `spring-boot-starter-data-jpa` and `mysql:mysql-connector-java`.

## Entry point

- `src/main/java/com/example/demo/DemoApplication.java`

This starts Spring Boot. It also sets a JVM property:

- `javax.net.ssl.trustStore=path/to/your/certificate.crt`

(That value is currently a placeholder string.)

## REST API

Implemented in `src/main/java/com/example/demo/Controller.java`.

### `GET /hello`

- **Purpose**: basic connectivity check
- **Response**: `200 OK` with plain text body

Example response body:

- `Hello, World!`

### `GET /all`

- **Purpose**: return all `TaxBracket` rows
- **Response**: `200 OK` with JSON array
- **Notes**:
  - Uses `TaxBracketRepository.findAll()`.
  - With the current `spring.autoconfigure.exclude` settings, this will only work if you re-enable datasource/JPA configuration.

### `POST /submit-form`

- **Purpose**: run the *optimization* flow (find a withdrawal strategy that maximizes years to depletion)
- **Request body**: JSON matching `com.example.demo.model.FormData`
- **Response**: JSON array of `BurndownTimeEvent`

`FormData` fields used by the controller:

- `tfsaAmount`: number
- `rrspAmount`: number
- `margAmountPrincipal`: number
- `margAmountCapitalGain`: number
- `amountPerYear`: number (desired after-tax spend per year)
- `interestRate`: number
- `income`: number

Processing summary:

- Builds an `AccountState` with three accounts:
  - `TFSA` (tax-free)
  - `RRSP` (tax-deferred)
  - `MARG` (taxable, with principal + capital gains split)
- Calls `TaxMinimizationService.main(startingAccountState)`.
- If the service returns `null`, the endpoint returns `null`.
- Otherwise reads the burndown from `C:\example\demo\burndown.ser` and returns it.

Important behavior:

- The service writes `burndown.ser` as a Java-serialized `ArrayList<BurndownTimeEvent>`.

Minimal example request:

```json
{
  "tfsaAmount": 100000,
  "rrspAmount": 200000,
  "margAmountPrincipal": 50000,
  "margAmountCapitalGain": 25000,
  "amountPerYear": 60000,
  "interestRate": 0.05,
  "income": 30000
}
```

### `POST /user-test`

- **Purpose**: run the *simulation* flow (use user-provided withdrawals per account)
- **Request body**: JSON matching `com.example.demo.model.UserTestFormData`
- **Response**: JSON array of `BurndownTimeEvent`

`UserTestFormData` fields used by the controller:

- Starting balances:
  - `tfsaAmount`, `rrspAmount`, `margAmountPrincipal`, `margAmountCapitalGain`
- Simulation inputs:
  - `tfsaWithdraw`, `rrspWithdraw`, `margWithdraw` (withdrawals per year, treated as pre-tax amounts)
  - `startingYear`
- Other:
  - `interestRate`, `income`

Processing summary:

- Builds an `AccountState` (same three-account model).
- Builds a `withdrawal` list in this order:
  - TFSA withdrawal
  - RRSP withdrawal
  - MARG withdrawal
- Calls `TaxSimulationService.main(startingAccountState, withdrawal, startingYear)`.
- If the service returns `null`, the endpoint returns `null`.
- Otherwise reads the burndown from `C:\example\demo\burndown.ser` and returns it.

Minimal example request:

```json
{
  "tfsaAmount": 100000,
  "rrspAmount": 200000,
  "margAmountPrincipal": 50000,
  "margAmountCapitalGain": 25000,
  "interestRate": 0.05,
  "income": 30000,
  "tfsaWithdraw": 15000,
  "rrspWithdraw": 25000,
  "margWithdraw": 10000,
  "startingYear": 2026
}
```

### `GET /results`

- **Purpose**: return the last computed burndown
- **Response**: JSON array of `BurndownTimeEvent`

Processing summary:

- Instantiates a new `ScenarioNode()` and calls `readToFileAl("C:\\example\\demo\\burndown.ser")`.
- Returns the list.

Important behavior:

- If `burndown.ser` does not exist (or cannot be deserialized), the code catches exceptions and returns `null`.

## Data model (relevant types)

### `AccountState` + accounts

Controllers build an `AccountState` via `AccountState.Builder` and add these concrete account types:

- `com.example.demo.model.TaxFreeAccount` (TFSA)
- `com.example.demo.model.TaxDeferredAccount` (RRSP)
- `com.example.demo.model.TaxableAccount` (MARG)

Each `BurndownTimeEvent` contains:

- `accountState`: snapshot of balances
- `year`: simulation year (double)
- `preTaxAmounts`: withdrawals used for the step
- `taxableAmount`: computed taxable portion per account (added during post-processing)

### `TaxBracket` / `FederalTaxBracket`

- `TaxBracket` maps to SQL table `tax_bracket`.
- `FederalTaxBracket` exists as a separate entity type.
- `TaxCalculationService` loads both lists in `@PostConstruct` via the JPA repositories.

## Core services (how the calculation works)

### `TaxMinimizationService` (optimization)

- Generates scenario permutations (withdrawal percentages) using `ScenarioUtility.generatePermutations(...)`.
- For each scenario, uses:
  - `TaxCalculationService.calculatePostTaxAmounts(...)` to create the allocation point.
  - `TaxCalculationService.calculatePreTaxAmount(node, scenario)` to compute per-account pre-tax withdrawals that satisfy the after-tax target.
- Estimates years until the first account depletes, then recurses on remaining accounts.
- Builds a full “burndown” timeline using `Postprocessor.generateBurndownUntilFirstAccountDepletes(...)`.
- Serializes the burndown list to `C:\example\demo\burndown.ser`.

### `TaxSimulationService` (fixed withdrawals)

- Uses user-provided `scenario.preTaxAmounts` directly.
- Computes years until depletion and burndown using the same post-processing helpers.
- Serializes the burndown list to `C:\example\demo\burndown.ser`.

## Local development

From `demo/`:

```bash
./mvnw spring-boot:run
```

The service should be available at:

- `http://localhost:8081`

## Known constraints / important notes

- The API currently relies on a **hard-coded Windows file path**: `C:\example\demo\burndown.ser`.
  - Running on another OS or without that directory will fail to write/read results.
- CORS is hard-coded to `http://localhost:4200`. If your Angular dev server runs elsewhere, calls will be blocked unless you update the annotations.
- JPA auto-configuration is excluded; endpoints that depend on repositories (like `/all`) require datasource/JPA to be re-enabled and configured.
