# ☕ Backend Architecture

The **Nest Egg Optimizer** backend is built using **Spring Boot (Java 17)**. It handles the server-side API requests, compiles the tax calculations, runs recursive optimization searches, and outputs simulated burndown timelines.

---

## 1. Codebase Structure

The backend source files are located under `demo/src/main/java/com/example/demo/`:

```
demo/src/main/java/com/example/demo/
├── DemoApplication.java          # Spring Boot main entry point
├── Controller.java               # REST controller exposing endpoints
├── FinanceUtility.java           # Math helpers (years until depletion)
├── service/                      # Core business services
│   ├── TaxCalculationService.java # Bracket loading & tax solvers
│   ├── TaxMinimizationService.java # Permutation optimizer search
│   └── TaxSimulationService.java # Forward simulation burndown
├── repository/                   # Optional JPA repositories
│   └── TaxBracketRepository.java
└── model/                        # Data transfer objects & models
    ├── TaxBracket.java           # Bracket database entity
    ├── FormData.java             # User input serializer
    ├── UserTestFormData.java     # Test strategy inputs
    └── BurndownTimeEvent.java    # Annual state event data DTO
```

---

## 2. Dynamic Bracket Loading

Upon startup, the **`TaxCalculationService`** loads tax bracket coordinates from a static text resource `tax-brackets.txt` into local memory:

- **Ontario Provincial Brackets**: 5 tax tiers ranging from 5.05% to 13.16%.
- **Federal Brackets**: 5 tax tiers ranging from 15.0% to 33.0%.
- Values are stored in `TaxBracket` list models sorted by their lower bounds for rapid progressive linear searches.

---

## 3. Financial Utility Functions

The **`FinanceUtility`** class contains optimized calculations for years until depletion under compound interest:

- **`calcYearsUntilDepletion`**: Determines the fractional or integer years a starting balance $B_0$ can support constant annual withdrawals $W$ at an interest rate $r$:
  $$t = -\frac{\ln\left(1 - \frac{B_0 \cdot r}{W}\right)}{\ln(1 + r)}$$
- **`calcFinalValue`**: Computes the final value of an account after growth and withdrawals over a fractional year.

---

## 4. API Controllers & Endpoints

Exposes three main endpoints on port `8081` with CORS enabled:

### `POST /submit-form`
Invokes `TaxMinimizationService.optimizeWithdrawalSequence` to search for the best strategy.
- **Input**: User financial starting balances and expected rates.
- **Output**: Array of `BurndownTimeEvent` representing the optimal strategy.

### `POST /user-test`
Invokes `TaxSimulationService.runCustomStrategy` to simulate manual ratios.
- **Input**: User inputs and explicit withdrawal amounts.
- **Output**: Array of `BurndownTimeEvent` representing the custom strategy.
