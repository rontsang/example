# 🔢 Optimization Algorithm

The primary goal of the Nest Egg Optimizer is to search for the withdrawal allocation path that yields the longest possible lifespan before the retirement portfolio is completely depleted. 

Rather than executing a naive brute-force search over all possible annual withdrawal configurations (which would suffer from an exponential curse of dimensionality), the system utilizes a **recursive multi-stage local grid search**.

---

## 1. Multi-Stage Chronological Splitting

A retirement portfolio consists of multiple account types (Tax-Free `TFSA`, Tax-Deferred `RRSP`, and Taxable `Non-Reg / Margin`). When withdrawing money to satisfy annual spending targets, different accounts deplete at different times.

The optimizer model splits the simulation chronologically into distinct **Stages** based on account depletion events:

```
[Start Year 0] 
      │
      ├── Stage 1: All 3 accounts active (TFSA, RRSP, Margin)
      │            * Ends when Margin account hits $0 *
      │
      ├── Stage 2: 2 accounts remaining (TFSA, RRSP)
      │            * Ends when RRSP account hits $0 *
      │
      └── Stage 3: 1 account remaining (TFSA)
                   * Ends when TFSA hits $0 (Final Depletion Year) *
```

Each stage is defined by its active account set. Inside each stage, the withdrawal ratios are held constant (e.g. Stage 1 withdrawals: 20% TFSA, 80% RRSP). 

When an account is depleted, the simulation pauses, logs the year of depletion, shrinks the set of available accounts, and recursively initiates a new optimization stage starting with the updated balances of the remaining accounts.

---

## 2. Permutation Grid Generation

For any active stage with $N$ accounts, the optimizer tests a grid of withdrawal percentage permutations.

- **Sum Constraint**: The withdrawal percentages across the accounts must sum to exactly 100% (since they collectively fulfill the annual spending target).
  $$\sum_{i=1}^{N} w_i = 1.0 \quad \text{where} \quad w_i \ge 0$$
- **Interval Resolution**: Permutations are generated using an interval step size. For example, with $N = 3$ and `intervalSize = 25%`, it tests:
  - `[100%, 0%, 0%]`
  - `[75%, 25%, 0%]`
  - `[75%, 0%, 25%]`
  - `[50%, 50%, 0%]`
  - ... and so on.

---

## 3. Local Grid Refinement

To find the optimal solution with high precision without checking millions of states, the search is conducted in progressive refinement loops:

1. **Coarse Search**: Runs a broad, coarse permutation grid (e.g., interval steps of 25%) across the entire search space to find the rough neighborhood of the best withdrawal strategy.
2. **Local Window Centering**: Centers a new, narrower search window around the best candidate found in the coarse run.
3. **Fine Grid Refinement**: Increases the resolution (e.g., interval steps of 5% or 1%) within that local window to pinpoint the exact optimal ratios.

---

## 4. Inversion Tax Solver

Because users specify the **After-Tax** spending amount they need to receive, the optimizer must determine how much pre-tax dollars to withdraw. 

For TFSA accounts, the pre-tax withdrawal is equal to the post-tax withdrawal. However, for RRSP and Margin accounts, withdrawals trigger income tax. The tax engine uses an iterative **numerical inversion loop** to calculate pre-tax targets:

1. **First Guess**: Assumes the pre-tax withdrawal is equal to the after-tax target.
2. **Tax Simulation**: Passes the guess to the progressive tax calculator.
3. **Error Evaluation**: Evaluates the difference between the resulting after-tax value and the target.
4. **Step Refinement**: Uses a modified secant/bisection solver to adjust the pre-tax guess, repeating until the error is within a tolerance of $\le \$0.01$.
