# Nest Egg Optimizer - Documentation Hub

Welcome to the **Nest Egg Optimizer** documentation. This system helps users determine the most tax-efficient sequence and ratio of withdrawals from various account types (Tax-Free, Tax-Deferred, and Taxable) to maximize the longevity of their retirement nest egg.

Select a section below to explore the architecture, algorithm, and UI behavior in detail:

---

### 🗺️ System Guides

- **[🔢 Optimization Algorithm](algorithm.html)**  
  A detailed breakdown of the recursive multi-stage local grid search algorithm used to find the longest-lasting portfolio withdrawal sequence.

- **[💵 Tax Calculations & Solver](tax-details.html)**  
  A detailed breakdown of Canadian progressive tax rules, dividend tax credits, and the numerical inversion solver used for reverse tax calculations.

- **[🛠️ Frontend Architecture](frontend.html)**  
  An overview of the Angular client, state synchronization, input binding, custom up/down spinner capsules, and interactive Chart.js modules.

- **[☕ Backend Architecture](backend.html)**  
  Details on the Spring Boot backend service, progressive federal/provincial tax calculation engine, and numerical inversion solver for pre-tax targets.

- **[🎨 UI Behaviors & Styling](ui-behavior.html)**  
  A guide to the responsive grid breakpoints, resize observers, range slider track extensions, and chart year-clamp behaviors.

- **[🔮 Future Roadmap & TODOs](todo.html)**  
  Exploring advanced features on the roadmap, including stochastic optimization (Markov Chain Monte Carlo) and Reinforcement Learning (Q-learning MDP models).

---

## 🚀 Repository Layout

The repository is organized as a monorepo containing the following components:

- **`demo/`**: Spring Boot (Java 17) backend service. Exposes REST API endpoints and contains the tax calculation, portfolio simulation, and withdrawal optimization engine.
- **`demo-client/`**: Angular frontend client. Displays forms for user financial inputs and utilizes Chart.js to render interactive charts of portfolio burndown scenarios.
- **`start-backend.ps1`**: PowerShell script to start the backend with Maven.
- **`start-frontend.ps1`**: PowerShell script to install dependencies and run the Angular frontend client.
- **`docs/`**: Markdown documentation files hosted on GitHub Pages.
