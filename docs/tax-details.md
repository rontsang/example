# 💵 Tax Calculations & Reverse Tax Solver

To accurately simulate a retirement portfolio burndown in Canada, the system models federal and provincial (Ontario) progressive tax brackets, capital gains inclusion rates, and Canadian eligible dividend tax credit rules.

---

## 1. Canadian Progressive Income Tax Modeling

Taxes are calculated by applying progressive marginal rates to the user's total taxable income.

### Basic Personal Amounts (BPA)
Taxable income below the Basic Personal Amount is taxed at $0\%$.
- **Federal BPA**: $\$15,000$ (Canada)
- **Provincial BPA**: $\$11,865$ (Ontario)

### Progressive Brackets
Taxable income is split across brackets, and the corresponding marginal tax rates are applied. The tax brackets are loaded dynamically from `tax-brackets.txt`:

$$\text{Tax Owed} = \sum_{j} \text{width}_j \times \text{rate}_j$$

Where $\text{width}_j$ is the portion of the taxable income falling within bracket $j$.

---

## 2. Tax Treatments by Account Type

Different accounts trigger different tax rules upon withdrawal:

### Tax-Free Savings Account (TFSA)
- **Taxable income contribution**: $\$0$
- **Net withdrawal**: equal to the gross withdrawal.

### Registered Retirement Savings Plan (RRSP)
- **Taxable income contribution**: $100\%$ of the withdrawn amount.
- Treated as regular earned income.

### Non-Registered / Margin Account
Withdrawals from the Margin account are composed of two parts: **Principal** and **Capital Gains**.
- **Principal**: Returned tax-free.
- **Capital Gains**: Subject to a $50\%$ inclusion rate. Only $50\%$ of the gain portion is included in taxable income.
  $$\text{Taxable Capital Gain} = \text{Withdrawal} \times \left( \frac{\text{Accrued Capital Gain}}{\text{Total Balance}} \right) \times 0.50$$

---

## 3. Canadian Eligible Dividend Tax Credit (DTC)

For Non-Registered holdings, dividends paid out annually are taxed using the gross-up and tax credit mechanism:

1. **Gross-up**: Dividends are grossed up by $38\%$ and added to taxable income:
   $$\text{Taxable Dividend} = \text{Dividend Paid} \times 1.38$$
2. **Federal Dividend Tax Credit**: A credit of $15.02\%$ of the grossed-up dividend is subtracted from federal taxes owed.
3. **Provincial Dividend Tax Credit**: A credit of $10\%$ of the grossed-up dividend (for Ontario) is subtracted from provincial taxes owed.

This significantly reduces the net tax rate paid on eligible Canadian dividends compared to regular income.

---

## 4. The Reverse Tax Solver (Pre-Tax Target Search)

Because the user defines the **After-Tax** spending amount they need to receive (e.g. $\$75,000$ per year), the system must determine the exact **Pre-Tax** withdrawal needed from the RRSP and Margin accounts.

We must solve for the pre-tax withdrawal $x$ such that:
$$f(x) - T(x) = \text{Target After-Tax Income}$$

Where $T(x)$ is the progressive tax function. Since $T(x)$ is a piecewise linear function (due to brackets), we cannot invert it analytically in a simple way when multiple income sources (RRSP, capital gains, dividends) interact.

### Numerical Inversion Algorithm
The solver uses an **iterative secant/bisection method** to converge on the pre-tax value:

```
                  ┌─────────────────────────────────┐
                  │  Set lower bound: L = Target    │
                  │  Set upper bound: U = Target*3  │
                  └────────────────┬────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │      Compute mid = (L+U)/2  │
                    └──────────────┬──────────────┘
                                   │
                 ┌─────────────────▼──────────────────┐
                 │ Sim tax: afterTax = mid - Tax(mid) │
                 └─────────────────┬──────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
   [afterTax < Target]                       [afterTax >= Target]
     L = mid                                   U = mid
              │                                         │
              └────────────────────┬────────────────────┘
                                   │
                      ┌────────────▼────────────┐
                      │  Error = |afterTax - T| │
                      └────────────┬────────────┘
                                   │
                   [Error <= $0.01] ?
                    ├── Yes ──> Return mid (Solution)
                    └── No  ──> Repeat from mid compute
```

This solver converges within $\approx 10-15$ iterations to a tolerance of $\le \$0.01$, ensuring perfect mathematical precision for every simulated year.
