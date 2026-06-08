# 🛠️ Frontend Architecture

The **Nest Egg Optimizer** frontend is built as a single-page web application using **Angular (v17)** and styled with premium vanilla CSS. It handles all forms, input validation, local storage persistence, state synchronization, and chart visualizations.

---

## 1. Directory Structure

The core codebase is located under `demo-client/src/app/`:

```
demo-client/src/app/
├── app.component.html         # Main dashboard layout wrapper
├── app.component.scss         # Global sidebar flex layouts
├── app.component.ts           # Mobile viewport toggles
├── userinput/                 # Starting balances & assumptions form
│   ├── userinput.component.html
│   ├── userinput.component.css
│   └── userinput.component.ts
├── displaywindow/             # Tabs container (Optimizer, Monte Carlo, Test)
│   ├── displaywindow.component.html
│   ├── displaywindow.component.css
│   └── displaywindow.component.ts
├── chart/                     # Line chart (Graph view) & details panel
│   ├── chart.component.html
│   ├── chart.component.css
│   └── chart.component.ts
├── bar-chart/                 # Monte Carlo sims (histogram & distribution)
│   ├── bar-chart.component.html
│   ├── bar-chart.component.css
│   └── bar-chart.component.ts
└── services/                  # State sharing and services
    ├── SharedService.ts       # RxJS EventEmitters
    └── local-optimizer.service.ts # Math & optimization engine
```

---

## 2. State Sharing & Synchronization

Because inputs and simulations reside in different components, state is shared reactively using a custom **Shared Service** pattern:

- **RxJS BehaviorSubjects**: Maintain the active inputs form state (`currentInputData$`). Components subscribe to this stream to receive real-time updates.
- **Obsolete Flagging**: When a user changes any starting balance or rate of return in the input panel, the system fires a notification indicating the active graph is **obsolete**. The main chart is greyed out with an overlay until the user recalculates the strategy.
- **Bidirectional Bindings**: Volatility changes on the Monte Carlo page automatically update the main form, and changes to the asset mix allocator in the assumptions panel update the Monte Carlo risk profiles.

---

## 3. Custom Input Elements & Spinners

To offer a premium, interactive user experience:
- **Vertical Alignment**: Number inputs and `%` suffixes are centered vertically inside custom input capsules.
- **Up/Down Spinner Buttons (▲/▼)**: Interacting with the custom spinner arrows increments or decrements the assumptions parameters (Inflation, Expected Return, Dividend Yield) in exact `0.5%` steps.
- **Continuous Presets Slider**: The Monte Carlo risk profile range slider maps a continuous visual range of `0 to 100` to non-linear standard deviation presets (Cash 0%, Conservative 5%, Balanced 10%, Growth 16%, Aggressive 25%).

---

## 4. Visualizations & Chart.js Integration

- **Line Chart (`MyChart`)**: Renders TFSA, RRSP, Margin, and Total asset curves over time. Point radius is set to 0 for a flat, premium vector look, showing hover dots on graph hover.
- **Distribution Chart (`DistributionChart`)**: Renders the normal probability density curve. Utilizes category axis coordinate mapping to position standard deviation lines (`-3σ`, `Average`, `+3σ`) and return boundary labels dynamically.
- **Monte Carlo Output (`MonteCarloChart`)**: Plots multiple lines representing different path trajectories, colored dynamically based on percentiles.
