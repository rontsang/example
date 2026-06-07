import { Injectable } from '@angular/core';

// --- Interfaces & Classes ---

export interface TaxBracket {
  index: number;
  lower_bound: number;
  upper_bound: number | null;
  rate: number;
}

const REAL_FEDERAL_BRACKETS: TaxBracket[] = [
  { index: 0, lower_bound: 0, upper_bound: 57375, rate: 0.145 },
  { index: 1, lower_bound: 57375, upper_bound: 114750, rate: 0.205 },
  { index: 2, lower_bound: 114750, upper_bound: 177882, rate: 0.26 },
  { index: 3, lower_bound: 177882, upper_bound: 253414, rate: 0.29 },
  { index: 4, lower_bound: 253414, upper_bound: null, rate: 0.33 }
];

const DUMMY_BRACKETS: TaxBracket[] = [
  { index: 0, lower_bound: 0, upper_bound: 10000, rate: 0.10 },
  { index: 1, lower_bound: 10000, upper_bound: 40000, rate: 0.20 },
  { index: 2, lower_bound: 40000, upper_bound: 90000, rate: 0.30 },
  { index: 3, lower_bound: 90000, upper_bound: null, rate: 0.40 }
];

const PROVINCIAL_TAX_DATA: { [province: string]: { brackets: TaxBracket[], basicAmount: number } } = {
  "Ontario": {
    basicAmount: 11865,
    brackets: [
      { index: 0, lower_bound: 0, upper_bound: 52886, rate: 0.0505 },
      { index: 1, lower_bound: 52886, upper_bound: 105775, rate: 0.0915 },
      { index: 2, lower_bound: 105775, upper_bound: 150000, rate: 0.1116 },
      { index: 3, lower_bound: 150000, upper_bound: 220000, rate: 0.1216 },
      { index: 4, lower_bound: 220000, upper_bound: null, rate: 0.1316 }
    ]
  },
  "Alberta": {
    basicAmount: 21885,
    brackets: [
      { index: 0, lower_bound: 0, upper_bound: 148269, rate: 0.10 },
      { index: 1, lower_bound: 148269, upper_bound: 177922, rate: 0.12 },
      { index: 2, lower_bound: 177922, upper_bound: 237230, rate: 0.13 },
      { index: 3, lower_bound: 237230, upper_bound: 355845, rate: 0.14 },
      { index: 4, lower_bound: 355845, upper_bound: null, rate: 0.15 }
    ]
  },
  "British Columbia": {
    basicAmount: 12580,
    brackets: [
      { index: 0, lower_bound: 0, upper_bound: 47549, rate: 0.0506 },
      { index: 1, lower_bound: 47549, upper_bound: 95098, rate: 0.077 },
      { index: 2, lower_bound: 95098, upper_bound: 109130, rate: 0.105 },
      { index: 3, lower_bound: 109130, upper_bound: 132506, rate: 0.1229 },
      { index: 4, lower_bound: 132506, upper_bound: 181394, rate: 0.147 },
      { index: 5, lower_bound: 181394, upper_bound: 252752, rate: 0.168 },
      { index: 6, lower_bound: 252752, upper_bound: null, rate: 0.205 }
    ]
  },
  "Manitoba": {
    basicAmount: 15780,
    brackets: [
      { index: 0, lower_bound: 0, upper_bound: 47000, rate: 0.108 },
      { index: 1, lower_bound: 47000, upper_bound: 100000, rate: 0.1275 },
      { index: 2, lower_bound: 100000, upper_bound: null, rate: 0.174 }
    ]
  },
  "Saskatchewan": {
    basicAmount: 18491,
    brackets: [
      { index: 0, lower_bound: 0, upper_bound: 52057, rate: 0.105 },
      { index: 1, lower_bound: 52057, upper_bound: 148734, rate: 0.125 },
      { index: 2, lower_bound: 148734, upper_bound: null, rate: 0.145 }
    ]
  },
  "Quebec": {
    basicAmount: 18056,
    brackets: [
      { index: 0, lower_bound: 0, upper_bound: 51780, rate: 0.14 },
      { index: 1, lower_bound: 51780, upper_bound: 103545, rate: 0.19 },
      { index: 2, lower_bound: 103545, upper_bound: 126280, rate: 0.24 },
      { index: 3, lower_bound: 126280, upper_bound: null, rate: 0.2575 }
    ]
  },
  "New Brunswick": {
    basicAmount: 13083,
    brackets: [
      { index: 0, lower_bound: 0, upper_bound: 49835, rate: 0.094 },
      { index: 1, lower_bound: 49835, upper_bound: 99672, rate: 0.14 },
      { index: 2, lower_bound: 99672, upper_bound: 185064, rate: 0.16 },
      { index: 3, lower_bound: 185064, upper_bound: null, rate: 0.195 }
    ]
  },
  "Nova Scotia": {
    basicAmount: 11481,
    brackets: [
      { index: 0, lower_bound: 0, upper_bound: 29590, rate: 0.0879 },
      { index: 1, lower_bound: 29590, upper_bound: 59180, rate: 0.1495 },
      { index: 2, lower_bound: 59180, upper_bound: 93000, rate: 0.1667 },
      { index: 3, lower_bound: 93000, upper_bound: 150000, rate: 0.175 },
      { index: 4, lower_bound: 150000, upper_bound: null, rate: 0.21 }
    ]
  },
  "Prince Edward Island": {
    basicAmount: 13500,
    brackets: [
      { index: 0, lower_bound: 0, upper_bound: 32656, rate: 0.0965 },
      { index: 1, lower_bound: 32656, upper_bound: 64313, rate: 0.1363 },
      { index: 2, lower_bound: 64313, upper_bound: 105000, rate: 0.1665 },
      { index: 3, lower_bound: 105000, upper_bound: 140000, rate: 0.18 },
      { index: 4, lower_bound: 140000, upper_bound: null, rate: 0.1875 }
    ]
  },
  "Newfoundland and Labrador": {
    basicAmount: 10826,
    brackets: [
      { index: 0, lower_bound: 0, upper_bound: 43198, rate: 0.087 },
      { index: 1, lower_bound: 43198, upper_bound: 86395, rate: 0.145 },
      { index: 2, lower_bound: 86395, upper_bound: 154244, rate: 0.158 },
      { index: 3, lower_bound: 154244, upper_bound: 215943, rate: 0.173 },
      { index: 4, lower_bound: 215943, upper_bound: null, rate: 0.183 }
    ]
  },
  "Yukon": {
    basicAmount: 15000,
    brackets: [
      { index: 0, lower_bound: 0, upper_bound: 57375, rate: 0.064 },
      { index: 1, lower_bound: 57375, upper_bound: 114750, rate: 0.09 },
      { index: 2, lower_bound: 114750, upper_bound: 177882, rate: 0.109 },
      { index: 3, lower_bound: 177882, upper_bound: 253414, rate: 0.128 },
      { index: 4, lower_bound: 253414, upper_bound: null, rate: 0.15 }
    ]
  },
  "Northwest Territories": {
    basicAmount: 17373,
    brackets: [
      { index: 0, lower_bound: 0, upper_bound: 50597, rate: 0.059 },
      { index: 1, lower_bound: 50597, upper_bound: 101198, rate: 0.086 },
      { index: 2, lower_bound: 101198, upper_bound: 164525, rate: 0.122 },
      { index: 3, lower_bound: 164525, upper_bound: null, rate: 0.1405 }
    ]
  },
  "Nunavut": {
    basicAmount: 18767,
    brackets: [
      { index: 0, lower_bound: 0, upper_bound: 50789, rate: 0.04 },
      { index: 1, lower_bound: 50789, upper_bound: 101577, rate: 0.07 },
      { index: 2, lower_bound: 101577, upper_bound: 165129, rate: 0.09 },
      { index: 3, lower_bound: 165129, upper_bound: null, rate: 0.115 }
    ]
  }
};

const PROVINCIAL_DIVIDEND_CREDIT_DATA: { [province: string]: number } = {
  "Ontario": 0.05702,
  "Alberta": 0.0812,
  "British Columbia": 0.0596,
  "Manitoba": 0.08,
  "Saskatchewan": 0.11,
  "Quebec": 0.117,
  "New Brunswick": 0.053,
  "Nova Scotia": 0.0885,
  "Prince Edward Island": 0.105,
  "Newfoundland and Labrador": 0.054,
  "Yukon": 0.0602,
  "Northwest Territories": 0.115,
  "Nunavut": 0.0285
};

export class Account {
  principalAmount: number;
  capitalGainsAmount: number;
  accountName: string;
  isAmountTaxable: boolean = false;
  isCapitalGainsTaxable: boolean = false;
  capitalGainsTaxablePercentage: number = 0.0;

  constructor(principal: number, capitalGains: number, name: string) {
    this.principalAmount = principal;
    this.capitalGainsAmount = capitalGains;
    this.accountName = name;

    if (name === "RRSP") {
      this.isAmountTaxable = true;
      this.isCapitalGainsTaxable = true;
      this.capitalGainsTaxablePercentage = 1.00;
    } else if (name === "MARG" || name === "NON-REG") {
      this.isAmountTaxable = false;
      this.isCapitalGainsTaxable = true;
      this.capitalGainsTaxablePercentage = 0.50;
    }
  }

  get totalValue(): number {
    return this.principalAmount + this.capitalGainsAmount;
  }

  getTotalValue(): number {
    return this.principalAmount + this.capitalGainsAmount;
  }

  clone(): Account {
    const clone = new Account(this.principalAmount, this.capitalGainsAmount, this.accountName);
    clone.isAmountTaxable = this.isAmountTaxable;
    clone.isCapitalGainsTaxable = this.isCapitalGainsTaxable;
    clone.capitalGainsTaxablePercentage = this.capitalGainsTaxablePercentage;
    return clone;
  }
}

export class AccountState {
  postTaxAmountNeededPerYear: number;
  interestRate: number;
  income: number;
  accounts: Account[] = [];
  province: string = "Ontario";
  dividendYield: number = 0.0;

  constructor(postTaxAmountNeeded: number = 0, interestRate: number = 0, income: number = 0, dividendYield: number = 0.0) {
    this.postTaxAmountNeededPerYear = postTaxAmountNeeded;
    this.interestRate = interestRate;
    this.income = income;
    this.dividendYield = dividendYield;
  }

  get accountsList(): string[] {
    return this.accounts.map(acc => acc.accountName);
  }

  cloneAccountState(): AccountState {
    const clone = new AccountState(this.postTaxAmountNeededPerYear, this.interestRate, this.income, this.dividendYield);
    clone.accounts = this.accounts.map(acc => acc.clone());
    clone.province = this.province;
    return clone;
  }
}

export class OptimizationWindow {
  lowerBound: number;
  upperBound: number;

  constructor(lowerBound: number = 0.0, upperBound: number = 1.0) {
    this.lowerBound = lowerBound;
    this.upperBound = upperBound;
  }

  static initList(size: number): OptimizationWindow[] {
    const list = [];
    for (let i = 0; i < size; i++) {
      list.push(new OptimizationWindow(0.0, 1.0));
    }
    return list;
  }
}

export class BurndownTimeEvent {
  accountState: AccountState;
  year: number;
  preTaxAmounts: number[];
  taxableAmount: number[] = [];
  isInfinite: boolean = false;
  dividends: number = 0.0;
  dividendTaxable: number = 0.0;

  constructor(accountState: AccountState, year: number, preTaxAmounts: number[]) {
    this.accountState = accountState;
    this.year = year;
    this.preTaxAmounts = preTaxAmounts;
  }
}

export class Scenario {
  calculationPoint: number[] = [];
  preTaxAmounts: number[] = [];
  postTaxAmounts: number[] = [];
  taxableAmounts: number[] = [];
  yearsToDepletion: number = 0.0;
  yearsToFirstAccountDepletion: number = Infinity;
  indexOfFirstAccountDepletion: number = -1;
}

export class ScenarioNode {
  startingAccountState: AccountState;
  endingAccountState: AccountState | null = null;
  level: number;
  scenario: Scenario;
  debugScenario: number;
  optimizationWindows: OptimizationWindow[];
  children: ScenarioNode[] = [];
  optimalNodes: ScenarioNode[] = [];
  optimalChild: ScenarioNode | null = null;
  yearsToDepletion: number = Infinity;
  optimalWindow: number[] | null = null;
  optimalIndex: number = -1;

  constructor(
    startingState: AccountState,
    endingState: AccountState | null = null,
    level: number = 0,
    scenario: Scenario | null = null,
    debugScenario: number = 0,
    optimizationWindows: OptimizationWindow[] | null = null
  ) {
    this.startingAccountState = startingState;
    this.endingAccountState = endingState;
    this.level = level;
    this.scenario = scenario || new Scenario();
    this.debugScenario = debugScenario;
    this.optimizationWindows = optimizationWindows || [];
  }

  getNumAccounts(): number {
    return this.startingAccountState ? this.startingAccountState.accounts.length : 0;
  }

  getOptimizationWindows(): OptimizationWindow[] {
    if (this.optimizationWindows.length === 0) {
      this.optimizationWindows = OptimizationWindow.initList(this.getNumAccounts());
    }
    return this.optimizationWindows;
  }

  addChild(child: ScenarioNode) {
    this.children.push(child);
  }

  getChild(index: number): ScenarioNode | null {
    return index < this.children.length ? this.children[index] : null;
  }

  getCurrentOptimizationNode(): ScenarioNode {
    return this.optimalNodes[this.optimalNodes.length - 1];
  }

  cloneNodeWithoutChildren(): ScenarioNode {
    return new ScenarioNode(
      this.startingAccountState,
      null,
      this.level,
      null,
      this.debugScenario
    );
  }

  getOptimalChildAndYearsToDepletion() {
    this.setOptimalChild();
    this.setYearsToDepletion();
  }

  setOptimalChild() {
    if (this.optimalNodes.length > 0) {
      let lastOpt = this.optimalNodes[this.optimalNodes.length - 1];
      lastOpt.getOptimalChildAndYearsToDepletion();
      this.optimalChild = lastOpt.optimalChild;
      this.optimalWindow = lastOpt.optimalWindow;
      this.optimalIndex = lastOpt.optimalIndex;
    } else if (this.children.length > 0) {
      this.optimalChild = null;
      for (let idx = 0; idx < this.children.length; idx++) {
        let child = this.children[idx];
        child.getOptimalChildAndYearsToDepletion();
        if (this.optimalChild === null || child.yearsToDepletion > this.optimalChild.yearsToDepletion) {
          this.optimalChild = child;
          this.optimalWindow = child.optimalWindow;
          this.optimalIndex = idx;
        }
      }
    }
  }

  setYearsToDepletion() {
    if (this.scenario) {
      this.yearsToDepletion = this.scenario.yearsToFirstAccountDepletion;
    } else {
      this.yearsToDepletion = 0.0;
    }

    if (this.optimalChild) {
      this.yearsToDepletion += this.optimalChild.yearsToDepletion;
    }
  }
}

// --- Finance Compounding Helpers ---

function calcYearsUntilDepletion(balance: number, annualWithdrawal: number, annualReturnRate: number): number {
  let tempBalance = balance;
  let years = 0.0;
  const MAX_YEARS = 150.0;
  while (tempBalance > 0) {
    let yearEndBalance = tempBalance * (1 + annualReturnRate) - annualWithdrawal;
    if (yearEndBalance >= tempBalance || years > MAX_YEARS) {
      years = Infinity;
      break;
    }
    if (yearEndBalance > 0) {
      years += 1.0;
    } else {
      let partial = tempBalance / annualWithdrawal;
      tempBalance *= 1 + annualReturnRate * partial;
      years += tempBalance / annualWithdrawal;
    }
    tempBalance = yearEndBalance;
  }
  return years;
}

function calcFinalValue(balance: number, annualReturnRate: number, years: number, annualWithdrawal: number): number {
  let tempBalance = balance;
  let i = 1;
  while (i < years) {
    tempBalance = tempBalance * (1 + annualReturnRate) - annualWithdrawal;
    i += 1;
  }
  let finalYearPercentage = years - Math.floor(years);
  tempBalance = tempBalance * (1 + annualReturnRate * finalYearPercentage) - annualWithdrawal * finalYearPercentage;
  return tempBalance;
}

// --- Tax Calculations ---

function incomeAfterTaxCredit(amount: number, taxCredit: number): number {
  if (amount - taxCredit < 0) {
    return 0.0;
  }
  return amount - taxCredit;
}

function calculateTaxByLocation(
  taxableIncome: number,
  location: string,
  useRealBrackets: boolean,
  grossedUpDividends: number
): number {
  let bracketsList: TaxBracket[] = [];
  let divCreditRate = 0.0;

  if (useRealBrackets) {
    if (location === "Canada") {
      bracketsList = REAL_FEDERAL_BRACKETS;
      divCreditRate = 0.150198; // Federal eligible dividend tax credit: 15.0198% of grossed-up dividend
    } else {
      const provData = PROVINCIAL_TAX_DATA[location] || PROVINCIAL_TAX_DATA["Ontario"];
      bracketsList = provData.brackets;
      divCreditRate = PROVINCIAL_DIVIDEND_CREDIT_DATA[location] || 0.05702; // Provincial eligible DTC rate
    }
  } else {
    bracketsList = DUMMY_BRACKETS;
    divCreditRate = location === "Canada" ? 0.10 : 0.05;
  }

  let preTaxAmount = taxableIncome;
  let taxAmount = 0.0;
  let currentBracketIdx = 0;

  while (currentBracketIdx < bracketsList.length) {
    let bracket = bracketsList[currentBracketIdx];
    if (bracket.lower_bound > preTaxAmount) {
      break;
    }

    if (bracket.upper_bound !== null) {
      if (bracket.upper_bound < preTaxAmount) {
        taxAmount += (bracket.upper_bound - bracket.lower_bound) * bracket.rate;
      } else {
        taxAmount += (preTaxAmount - bracket.lower_bound) * bracket.rate;
      }
    } else {
      taxAmount += (preTaxAmount - bracket.lower_bound) * bracket.rate;
    }

    currentBracketIdx += 1;
  }

  // Subtract dividend tax credit (non-refundable)
  let dividendTaxCredit = grossedUpDividends * divCreditRate;
  taxAmount = Math.max(0, taxAmount - dividendTaxCredit);

  return taxAmount;
}

function calculatePostTaxAmount(
  amount: number,
  useRealBrackets: boolean,
  provinceName: string = "Ontario",
  grossedUpDividends: number = 0
): number {
  const federalBasicAmount = 15000.0;
  const provData = PROVINCIAL_TAX_DATA[provinceName] || PROVINCIAL_TAX_DATA["Ontario"];
  const provincialBasicAmount = provData.basicAmount;

  let provincialIncome = incomeAfterTaxCredit(amount, provincialBasicAmount);
  let federalIncome = incomeAfterTaxCredit(amount, federalBasicAmount);

  let taxProvincial = calculateTaxByLocation(provincialIncome, provinceName, useRealBrackets, grossedUpDividends);
  let taxFederal = calculateTaxByLocation(federalIncome, "Canada", useRealBrackets, grossedUpDividends);

  return amount - taxProvincial - taxFederal;
}

function calculatePreTaxAmountNode(node: ScenarioNode, scenarioPercentages: number[], useRealBrackets: boolean) {
  let income = node.startingAccountState.income;
  let totalWithdrawal = node.startingAccountState.postTaxAmountNeededPerYear;

  let accountRrsp: Account | null = null;
  let accountMarg: Account | null = null;

  let targetRrspPct = 0.0;
  let targetTfsaPct = 0.0;
  let targetMargPct = 0.0;

  for (let i = 0; i < node.startingAccountState.accounts.length; i++) {
    let account = node.startingAccountState.accounts[i];
    let percentage = node.scenario.calculationPoint[i];
    if (account.accountName === "RRSP") {
      targetRrspPct = percentage;
      accountRrsp = account;
    } else if (account.accountName === "TFSA") {
      targetTfsaPct = percentage;
    } else if (account.accountName === "MARG" || account.accountName === "NON-REG") {
      targetMargPct = percentage;
      accountMarg = account;
    }
  }

  let totalNonTaxable = targetRrspPct + targetMargPct;
  let ratioCg2P = 0.0;
  let ratioCg = 0.0;

  if (accountMarg === null) {
    targetMargPct = 0.0;
  } else {
    let marginTotal = accountMarg.capitalGainsAmount + accountMarg.principalAmount;
    if (marginTotal > 0) {
      ratioCg2P = accountMarg.capitalGainsAmount / marginTotal;
    }
    ratioCg = accountMarg.capitalGainsTaxablePercentage;
  }

  let dividends = 0.0;
  if (accountMarg !== null) {
    dividends = accountMarg.totalValue * node.startingAccountState.dividendYield;
  }
  let grossedUpDividends = dividends * 1.38;

  let postTaxTarget = totalWithdrawal;

  let preTaxGuessRrsp = (postTaxTarget - income - dividends) * targetRrspPct;
  let preTaxGuessMarg = (postTaxTarget - income - dividends) * targetMargPct;
  let preTaxGuessTfsa = (postTaxTarget - income - dividends) * targetTfsaPct;

  let tolerance = 50.0;
  let differenceTotal = Infinity;
  let iterations = 0;

  if (totalNonTaxable !== 0) {
    while (Math.abs(differenceTotal) > tolerance) {
      iterations += 1;
      if (iterations > 50) {
        break;
      }

      let taxableRrsp = preTaxGuessRrsp;
      let taxableMargin = preTaxGuessMarg * ratioCg2P * ratioCg;
      let preTaxTotal = income + taxableRrsp + taxableMargin + grossedUpDividends;

      let postTaxTotal = calculatePostTaxAmount(preTaxTotal, useRealBrackets, node.startingAccountState.province, grossedUpDividends);

      let effectiveRate = 0.0;
      if (preTaxTotal !== 0) {
        effectiveRate = 1.0 - postTaxTotal / preTaxTotal;
      }

      let effectiveIncome = income * (1.0 - effectiveRate);
      let effectiveRrsp = preTaxGuessRrsp * (1.0 - effectiveRate);

      let effectiveMarginP = preTaxGuessMarg * (1.0 - ratioCg2P);
      let effectiveMarginCgNontaxable = preTaxGuessMarg * ratioCg2P * ratioCg;
      let effectiveMarginCgTaxable = preTaxGuessMarg * ratioCg2P * (ratioCg * (1.0 - effectiveRate));

      let effectiveMarg = effectiveMarginP + effectiveMarginCgNontaxable + effectiveMarginCgTaxable;

      let effectiveDividends = dividends - grossedUpDividends * effectiveRate;

      let effectiveTfsa = 0.0;
      if (targetTfsaPct !== 0) {
        effectiveTfsa = preTaxGuessTfsa;
      }

      differenceTotal = postTaxTarget - effectiveIncome - effectiveRrsp - effectiveMarg - effectiveTfsa - effectiveDividends;

      let newGuessTotal = preTaxGuessRrsp + preTaxGuessMarg + preTaxGuessTfsa + differenceTotal;
      preTaxGuessRrsp = newGuessTotal * targetRrspPct;
      preTaxGuessMarg = newGuessTotal * targetMargPct;
      preTaxGuessTfsa = newGuessTotal * targetTfsaPct;
    }
  } else {
    let preTaxTotal = income + grossedUpDividends;
    let postTaxTotal = calculatePostTaxAmount(preTaxTotal, useRealBrackets, node.startingAccountState.province, grossedUpDividends);
    let effectiveRate = 0.0;
    if (preTaxTotal !== 0) {
      effectiveRate = 1.0 - postTaxTotal / preTaxTotal;
    }
    let effectiveIncome = income * (1.0 - effectiveRate);
    let effectiveDividends = dividends - grossedUpDividends * effectiveRate;
    preTaxGuessTfsa = totalWithdrawal - effectiveIncome - effectiveDividends;
  }

  node.scenario.preTaxAmounts = [];
  for (let i = 0; i < node.startingAccountState.accounts.length; i++) {
    let account = node.startingAccountState.accounts[i];
    if (account.accountName === "RRSP") {
      node.scenario.preTaxAmounts.push(preTaxGuessRrsp);
    } else if (account.accountName === "TFSA") {
      node.scenario.preTaxAmounts.push(preTaxGuessTfsa);
    } else if (account.accountName === "MARG") {
      node.scenario.preTaxAmounts.push(preTaxGuessMarg);
    }
  }
}

// --- Permutations & Grid Calculations ---

function generatePermutations(size: number, intervals: number): number[][] {
  const permutations: number[][] = [];

  function generate(current: number[], sizeRem: number, remaining: number) {
    if (sizeRem === 1) {
      let val = Math.round(remaining * 100.0) / 100.0;
      current.push(val);
      permutations.push([...current]);
      current.pop();
    } else {
      let increment = 1.0 / intervals;
      for (let i = 0; i <= intervals; i++) {
        let value = Math.round(i * increment * 100.0) / 100.0;
        let rem = Math.round(remaining * 100.0) / 100.0;
        if (value <= rem) {
          current.push(value);
          generate(current, sizeRem - 1, rem - value);
          current.pop();
        }
      }
    }
  }

  generate([], size, 1.0);
  return permutations;
}

function calculatePostTaxAmounts(parent: ScenarioNode, scenarioPerm: number[]) {
  let optimizationWindows = parent.getOptimizationWindows();
  let adjustedCalculation: number[] = new Array(parent.startingAccountState.accounts.length).fill(0.0);

  parent.scenario.calculationPoint = [];

  for (let accountNumber = 0; accountNumber < parent.startingAccountState.accounts.length; accountNumber++) {
    let lowerBound = optimizationWindows[accountNumber].lowerBound;
    let upperBound = optimizationWindows[accountNumber].upperBound;
    let rangeVal = upperBound - lowerBound;

    let adjustedPercentage = 0.0;
    if (accountNumber === scenarioPerm.length - 1) {
      let sumPrev = adjustedCalculation.slice(0, accountNumber).reduce((sum, val) => sum + val, 0.0);
      adjustedPercentage = 1.0 - sumPrev;
      adjustedCalculation[accountNumber] = adjustedPercentage;
    } else {
      adjustedPercentage = lowerBound + (scenarioPerm[accountNumber] * rangeVal);
      adjustedCalculation[accountNumber] = adjustedPercentage;
    }

    scenarioPerm[accountNumber] = adjustedPercentage;
    parent.scenario.calculationPoint.push(adjustedPercentage);
  }
}

function calculateYearsUntilFirstAccountDepletes(node: ScenarioNode) {
  let minYears = Infinity;
  node.scenario.yearsToFirstAccountDepletion = Infinity;
  node.scenario.indexOfFirstAccountDepletion = -1;

  for (let i = 0; i < node.startingAccountState.accounts.length; i++) {
    let account = node.startingAccountState.accounts[i];
    let annualWithdrawal = node.scenario.preTaxAmounts[i];
    let interestRate = node.startingAccountState.interestRate;

    let years = calcYearsUntilDepletion(account.totalValue, annualWithdrawal, interestRate);

    if (years < minYears) {
      minYears = years;
      node.scenario.yearsToFirstAccountDepletion = years;
      node.scenario.indexOfFirstAccountDepletion = i;
    }
  }

  if (node.scenario.yearsToFirstAccountDepletion === Infinity) {
    node.scenario.yearsToDepletion = Infinity;
    return;
  }
}

function calculateEndingAccount(parent: ScenarioNode, i: number): Account {
  let startingAccount = parent.startingAccountState.accounts[i];
  let preTaxAmount = parent.scenario.preTaxAmounts[i];
  let yearsToDeplete = parent.scenario.yearsToFirstAccountDepletion;
  let interestRate = parent.startingAccountState.interestRate;
  let dividendYield = parent.startingAccountState.dividendYield || 0.0;

  let futureValuePrincipal = startingAccount.principalAmount;
  let futureValueCapitalGains = startingAccount.capitalGainsAmount;

  let year = 1;
  while (year < yearsToDeplete) {
    let totalValue = futureValuePrincipal + futureValueCapitalGains;
    if (totalValue > 0) {
      let effectiveGrowth = interestRate;
      if (startingAccount.accountName === "MARG" || startingAccount.accountName === "NON-REG") {
        effectiveGrowth = interestRate - dividendYield;
      }
      futureValueCapitalGains += (futureValuePrincipal + futureValueCapitalGains) * effectiveGrowth;
      totalValue = futureValuePrincipal + futureValueCapitalGains;
      futureValuePrincipal -= preTaxAmount * futureValuePrincipal / totalValue;
      futureValueCapitalGains -= preTaxAmount * futureValueCapitalGains / totalValue;
    }
    year += 1;
  }

  let partialYear = yearsToDeplete - Math.floor(yearsToDeplete);
  let effectiveGrowth = interestRate;
  if (startingAccount.accountName === "MARG" || startingAccount.accountName === "NON-REG") {
    effectiveGrowth = interestRate - dividendYield;
  }
  futureValueCapitalGains += (futureValuePrincipal + futureValueCapitalGains) * effectiveGrowth * partialYear;
  let totalValue = futureValuePrincipal + futureValueCapitalGains;
  if (totalValue > 0) {
    futureValuePrincipal -= preTaxAmount * (futureValuePrincipal / totalValue) * partialYear;
    futureValueCapitalGains -= preTaxAmount * (futureValueCapitalGains / totalValue) * partialYear;
  }

  let endingAccount = new Account(futureValuePrincipal, futureValueCapitalGains, startingAccount.accountName);
  endingAccount.isAmountTaxable = startingAccount.isAmountTaxable;
  endingAccount.isCapitalGainsTaxable = startingAccount.isCapitalGainsTaxable;
  endingAccount.capitalGainsTaxablePercentage = startingAccount.capitalGainsTaxablePercentage;
  return endingAccount;
}

function calculateEndingAccountState(parent: ScenarioNode) {
  parent.endingAccountState = new AccountState(
    parent.startingAccountState.postTaxAmountNeededPerYear,
    parent.startingAccountState.interestRate,
    parent.startingAccountState.income
  );

  for (let i = 0; i < parent.getNumAccounts(); i++) {
    if (i !== parent.scenario.indexOfFirstAccountDepletion && parent.startingAccountState.accounts[i].getTotalValue() > 0) {
      let endingAccount = calculateEndingAccount(parent, i);
      parent.endingAccountState.accounts.push(endingAccount);
    }
  }
}

let globalDebugScenario = 0;
const iterationsPerScenario = 4;
const intervalSize = 2;

function generateChildren(parent: ScenarioNode, useRealBrackets: boolean) {
  let numAccounts = parent.endingAccountState ? parent.endingAccountState.accounts.length : 0;
  if (numAccounts === 0) {
    return;
  }

  let scenarioPermutations = generatePermutations(numAccounts, intervalSize);

  for (let scenarioPerm of scenarioPermutations) {
    globalDebugScenario += 1;
    let child = new ScenarioNode(
      parent.endingAccountState!,
      new AccountState(),
      parent.level + 1,
      new Scenario(),
      globalDebugScenario,
      parent.getOptimizationWindows().map(w => new OptimizationWindow(w.lowerBound, w.upperBound))
    );
    calculatePostTaxAmounts(child, scenarioPerm);
    calculatePreTaxAmountNode(child, scenarioPerm, useRealBrackets);

    parent.addChild(child);
  }
}

function calculateChildren(parent: ScenarioNode, useRealBrackets: boolean) {
  if (parent !== null) {
    for (let child of parent.children) {
      calculateYearsUntilAccountsAreEmpty(child, useRealBrackets);
      if (child.scenario.yearsToDepletion === Infinity) {
        if (parent.scenario === null) {
          parent.scenario = new Scenario();
        }
        parent.scenario.yearsToDepletion = Infinity;
        return;
      }
    }
  }
}

function calculateYearsUntilAccountsAreEmpty(parentNode: ScenarioNode, useRealBrackets: boolean): number {
  calculateYearsUntilFirstAccountDepletes(parentNode);
  if (parentNode.scenario.yearsToFirstAccountDepletion !== Infinity) {
    calculateEndingAccountState(parentNode);
    generateChildrenAndCalculate(parentNode, useRealBrackets);
  }
  return parentNode.scenario.yearsToDepletion;
}

function generateChildrenAndCalculate(parent: ScenarioNode, useRealBrackets: boolean) {
  generateChildren(parent, useRealBrackets);
  calculateChildren(parent, useRealBrackets);

  while (
    parent.children.length > 1 &&
    parent.optimalNodes.length < iterationsPerScenario &&
    parent.scenario.yearsToDepletion !== Infinity
  ) {
    setupNextOptimizationNode(parent);
    generateChildren(parent.getCurrentOptimizationNode(), useRealBrackets);
    calculateChildren(parent.getCurrentOptimizationNode(), useRealBrackets);
  }
}

function setupNextOptimizationNode(nodeToOptimize: ScenarioNode) {
  nodeToOptimize.getOptimalChildAndYearsToDepletion();
  setNextOptimalNode(nodeToOptimize);
  shrinkOptimizationWindow(nodeToOptimize);
}

function setNextOptimalNode(nodeToOptimize: ScenarioNode) {
  let nextIteration = nodeToOptimize.cloneNodeWithoutChildren();
  nodeToOptimize.optimalNodes.push(nextIteration);
  nodeToOptimize.getCurrentOptimizationNode().optimizationWindows = [];
  nextIteration.startingAccountState = nodeToOptimize.startingAccountState;
  nextIteration.endingAccountState = nodeToOptimize.endingAccountState;
}

function shrinkOptimizationWindow(nodeToOptimize: ScenarioNode) {
  let prevOptimalPoint = nodeToOptimize.optimalChild!.scenario.calculationPoint;
  let iteration = nodeToOptimize.optimalNodes.length;

  let currentOptNode = nodeToOptimize.getCurrentOptimizationNode();
  currentOptNode.optimizationWindows = [];

  let numAccounts = nodeToOptimize.optimalChild!.getNumAccounts();
  for (let j = 0; j < numAccounts; j++) {
    let prevAccountOptimalPoint = prevOptimalPoint[j];
    let intervalShift = 1.0 / (intervalSize * Math.pow(2, iteration));

    let lowerBound = prevAccountOptimalPoint === 0 ? 0.0 : prevAccountOptimalPoint - intervalShift;
    let upperBound = prevAccountOptimalPoint === 1 ? 1.0 : prevAccountOptimalPoint + intervalShift;

    if (prevAccountOptimalPoint === 0) {
      upperBound += intervalShift;
    }
    if (prevAccountOptimalPoint === 1) {
      lowerBound -= intervalShift;
    }

    currentOptNode.optimizationWindows.push(new OptimizationWindow(lowerBound, upperBound));
  }
}

// --- Postprocessor & Staging Helpers ---

function roundAccountToNearestCent(yearEndState: AccountState, accountIdx: number) {
  let acc = yearEndState.accounts[accountIdx];
  acc.principalAmount = Math.round(acc.principalAmount * 100.0) / 100.0;
  if (acc.principalAmount < 0.02) {
    acc.principalAmount = 0.0;
  }

  acc.capitalGainsAmount = Math.round(acc.capitalGainsAmount * 100.0) / 100.0;
  if (acc.capitalGainsAmount < 0.02) {
    acc.capitalGainsAmount = 0.0;
  }
}

function calculateYearsUntilFirstAccountDepletesForPostprocessor(startingAccountState: AccountState, withdrawalsPerYear: number[]): number {
  let minYears = Infinity;
  for (let i = 0; i < startingAccountState.accounts.length; i++) {
    let account = startingAccountState.accounts[i];
    let annualWithdrawal = withdrawalsPerYear[i];
    let interestRate = startingAccountState.interestRate;
    let years = calcYearsUntilDepletion(account.totalValue, annualWithdrawal, interestRate);
    if (years < minYears) {
      minYears = years;
    }
  }
  return minYears;
}

function calculateResultStatePerYear(
  startingAccountState: AccountState,
  withdrawalsPerYear: number[],
  burndown: BurndownTimeEvent[],
  yearsToFirstAccountDepletion: number
) {
  let currentState = startingAccountState.cloneAccountState();

  if (currentState.accounts.every(acc => acc.totalValue < 0.02)) {
    return;
  }

  let partialYear = Math.ceil(burndown[0].year) - burndown[0].year;
  let willItFillToNextYear = (yearsToFirstAccountDepletion - partialYear) > 0;
  let dividendYield = currentState.dividendYield || 0.0;

  if (burndown[0] !== null && burndown[0].year !== 0.0 && willItFillToNextYear) {
    let yearEndState = currentState.cloneAccountState();
    for (let account = 0; account < startingAccountState.accounts.length; account++) {
      let totalValue = currentState.accounts[account].totalValue;
      let capitalGains = currentState.accounts[account].capitalGainsAmount;
      let principal = currentState.accounts[account].principalAmount;

      let effectiveGrowth = currentState.interestRate;
      if (startingAccountState.accounts[account].accountName === "MARG" || startingAccountState.accounts[account].accountName === "NON-REG") {
        effectiveGrowth = currentState.interestRate - dividendYield;
      }

      yearEndState.accounts[account].capitalGainsAmount += (principal + capitalGains) * effectiveGrowth * partialYear;
      totalValue = yearEndState.accounts[account].capitalGainsAmount + yearEndState.accounts[account].principalAmount;
      capitalGains = yearEndState.accounts[account].capitalGainsAmount;

      if (totalValue > 0) {
        yearEndState.accounts[account].principalAmount -= withdrawalsPerYear[account] * principal / totalValue * partialYear;
        yearEndState.accounts[account].capitalGainsAmount -= withdrawalsPerYear[account] * capitalGains / totalValue * partialYear;
      }

      roundAccountToNearestCent(yearEndState, account);
    }

    burndown.push(new BurndownTimeEvent(yearEndState, Math.ceil(burndown[0].year), [...withdrawalsPerYear]));
    currentState = yearEndState;
    yearsToFirstAccountDepletion -= partialYear;
  }

  let year = 1;
  while (year < yearsToFirstAccountDepletion) {
    let yearEndState = currentState.cloneAccountState();
    for (let account = 0; account < startingAccountState.accounts.length; account++) {
      let totalValue = currentState.accounts[account].totalValue;
      let capitalGains = currentState.accounts[account].capitalGainsAmount;
      let principal = currentState.accounts[account].principalAmount;

      let effectiveGrowth = currentState.interestRate;
      if (startingAccountState.accounts[account].accountName === "MARG" || startingAccountState.accounts[account].accountName === "NON-REG") {
        effectiveGrowth = currentState.interestRate - dividendYield;
      }

      yearEndState.accounts[account].capitalGainsAmount += (principal + capitalGains) * effectiveGrowth;
      totalValue = yearEndState.accounts[account].capitalGainsAmount + yearEndState.accounts[account].principalAmount;
      capitalGains = yearEndState.accounts[account].capitalGainsAmount;

      if (totalValue > 0) {
        yearEndState.accounts[account].principalAmount -= withdrawalsPerYear[account] * principal / totalValue;
        yearEndState.accounts[account].capitalGainsAmount -= withdrawalsPerYear[account] * capitalGains / totalValue;
      }

      roundAccountToNearestCent(yearEndState, account);
    }

    burndown.push(new BurndownTimeEvent(yearEndState.cloneAccountState(), year + Math.ceil(burndown[0].year), [...withdrawalsPerYear]));
    currentState = yearEndState;
    year += 1;
  }

  let partialYearEnd = yearsToFirstAccountDepletion - Math.floor(yearsToFirstAccountDepletion);
  let yearEndState = currentState.cloneAccountState();
  for (let account = 0; account < startingAccountState.accounts.length; account++) {
    let totalValue = currentState.accounts[account].totalValue;
    let capitalGains = currentState.accounts[account].capitalGainsAmount;
    let principal = currentState.accounts[account].principalAmount;

    let effectiveGrowth = currentState.interestRate;
    if (startingAccountState.accounts[account].accountName === "MARG" || startingAccountState.accounts[account].accountName === "NON-REG") {
      effectiveGrowth = currentState.interestRate - dividendYield;
    }

    yearEndState.accounts[account].capitalGainsAmount += (principal + capitalGains) * effectiveGrowth * partialYearEnd;
    totalValue = yearEndState.accounts[account].capitalGainsAmount + yearEndState.accounts[account].principalAmount;
    capitalGains = yearEndState.accounts[account].capitalGainsAmount;

    if (totalValue > 0) {
      yearEndState.accounts[account].principalAmount -= withdrawalsPerYear[account] * principal / totalValue * partialYearEnd;
      yearEndState.accounts[account].capitalGainsAmount -= withdrawalsPerYear[account] * capitalGains / totalValue * partialYearEnd;
    }

    roundAccountToNearestCent(yearEndState, account);
  }

  if (willItFillToNextYear) {
    burndown.push(new BurndownTimeEvent(yearEndState, yearsToFirstAccountDepletion + Math.ceil(burndown[0].year), [...withdrawalsPerYear]));
  } else {
    burndown.push(new BurndownTimeEvent(yearEndState, yearsToFirstAccountDepletion + burndown[0].year, [...withdrawalsPerYear]));
  }
}

function generateBurndownUntilFirstAccountDepletes(
  startingAccountState: AccountState,
  withdrawalsPerYear: number[],
  currentBurnDown: BurndownTimeEvent[],
  startingYearOverride: number | null = null
): BurndownTimeEvent[] {
  let startingYear = 0.0;
  if (startingYearOverride !== null) {
    startingYear = startingYearOverride;
  }

  if (currentBurnDown && currentBurnDown.length > 0) {
    let lastEvent = currentBurnDown[currentBurnDown.length - 1];
    startingYear = lastEvent.year;
  }

  let newBurndown: BurndownTimeEvent[] = [];
  let startingEvent = new BurndownTimeEvent(startingAccountState.cloneAccountState(), startingYear, [...withdrawalsPerYear]);
  newBurndown.push(startingEvent);

  let yearsToFirstAccountDepletion = calculateYearsUntilFirstAccountDepletesForPostprocessor(startingAccountState, withdrawalsPerYear);
  if (yearsToFirstAccountDepletion < 1) {
    return newBurndown;
  }

  calculateResultStatePerYear(startingAccountState, withdrawalsPerYear, newBurndown, yearsToFirstAccountDepletion);
  return newBurndown;
}

function burndownStageN(currentScenarioNode: ScenarioNode, burndown: BurndownTimeEvent[], startingYear: number | null = null) {
  let nextBurnDown = generateBurndownUntilFirstAccountDepletes(
    currentScenarioNode.startingAccountState,
    currentScenarioNode.scenario.preTaxAmounts,
    burndown,
    startingYear
  );

  for (let event of nextBurnDown) {
    event.taxableAmount = [];
    
    let accountMarg = event.accountState.accounts.find(acc => acc.accountName === "MARG" || acc.accountName === "NON-REG") || null;
    let dividends = 0.0;
    if (accountMarg !== null) {
      dividends = accountMarg.totalValue * event.accountState.dividendYield;
    }
    event.dividends = dividends;
    event.dividendTaxable = dividends * 1.38;

    for (let i = 0; i < event.accountState.accounts.length; i++) {
      let acc = event.accountState.accounts[i];
      let totalVal = acc.principalAmount + acc.capitalGainsAmount;
      let ratio = totalVal > 0 ? acc.principalAmount / totalVal : 0.0;

      let totalTaxable = 0.0;
      if (acc.isAmountTaxable) {
        totalTaxable += event.preTaxAmounts[i] * ratio;
      }
      if (acc.isCapitalGainsTaxable) {
        totalTaxable += event.preTaxAmounts[i] * (1.0 - ratio) * acc.capitalGainsTaxablePercentage;
      }

      event.taxableAmount.push(totalTaxable);
    }
    burndown.push(event);
  }

  if (currentScenarioNode.optimalChild !== null) {
    burndownStageN(currentScenarioNode.optimalChild, burndown, startingYear);
  }
}

export function runMinimizationMain(startingState: AccountState, useRealBrackets: boolean): ScenarioNode | null {
  globalDebugScenario = 0;

  let root = new ScenarioNode(
    startingState,
    startingState,
    1,
    new Scenario(),
    0
  );
  generateChildrenAndCalculate(root, useRealBrackets);
  root.getOptimalChildAndYearsToDepletion();

  if (
    root.optimalChild !== null &&
    root.optimalChild.scenario !== null &&
    root.optimalChild.scenario.yearsToDepletion < 100 &&
    root.scenario !== null &&
    root.scenario.yearsToDepletion < 100
  ) {
    burndownStageN(root.optimalChild, []);
    root.getOptimalChildAndYearsToDepletion();
    return root;
  }

  return null;
}

export function computeBurndownMinimization(startingState: AccountState, useRealBrackets: boolean): BurndownTimeEvent[] | null {
  let root = runMinimizationMain(startingState, useRealBrackets);
  if (root === null || root.optimalChild === null) {
    return null;
  }

  let burndown: BurndownTimeEvent[] = [];
  burndownStageN(root.optimalChild, burndown);
  return burndown;
}

export function runSimulationMain(startingState: AccountState, withdrawals: number[], startingYear: number): ScenarioNode | null {
  let scenario = new Scenario();
  scenario.preTaxAmounts = withdrawals;

  let root = new ScenarioNode(
    startingState,
    startingState,
    1,
    scenario,
    0
  );

  calculateYearsUntilFirstAccountDepletes(root);
  if (root.scenario.yearsToFirstAccountDepletion !== Infinity) {
    calculateEndingAccountState(root);
  }

  root.getOptimalChildAndYearsToDepletion();

  if (root.scenario.yearsToDepletion < 100) {
    return root;
  }
  return null;
}

export function computeBurndownSimulation(startingState: AccountState, withdrawals: number[], startingYear: number): BurndownTimeEvent[] | null {
  let root = runSimulationMain(startingState, withdrawals, startingYear);
  if (root === null) {
    return null;
  }

  let burndown: BurndownTimeEvent[] = [];
  burndownStageN(root, burndown, startingYear);
  return burndown;
}

// --- Angular Injectable Service ---

@Injectable({
  providedIn: 'root'
})
export class LocalOptimizerService {
  useRealBrackets: boolean = true;

  calculateTaxesOwed(taxableIncome: number, province: string = "Ontario", grossedUpDividends: number = 0): number {
    return taxableIncome - calculatePostTaxAmount(taxableIncome, this.useRealBrackets, province, grossedUpDividends);
  }

  getProvincialDividendCreditRate(province: string): number {
    return PROVINCIAL_DIVIDEND_CREDIT_DATA[province] || 0.05702;
  }

  private createAccountStateFromForm(form: any): AccountState {
    const interestRate = Number(form.interestRate || 0);
    const dividendYield = Number(form.dividendYield || 0) / 100; // convert percentage to decimal e.g. 2.0 -> 0.02
    const state = new AccountState(
      Number(form.amountPerYear || 0),
      interestRate,
      Number(form.income || 0),
      dividendYield
    );
    state.province = form.province || "Ontario";
    state.accounts.push(new Account(Number(form.tfsaAmount || 0), 0.0, "TFSA"));
    state.accounts.push(new Account(Number(form.rrspAmount || 0), 0.0, "RRSP"));
    const margPrincipalInput = Number(form.margAmountPrincipal || 0);
    const margCapitalGainInput = Number(form.margAmountCapitalGain || 0);
    const actualMargPrincipal = Math.max(0, margPrincipalInput - margCapitalGainInput);
    state.accounts.push(new Account(actualMargPrincipal, margCapitalGainInput, "MARG"));
    return state;
  }

  private serializeEvent(event: BurndownTimeEvent): any {
    return {
      accountState: {
        postTaxAmountNeededPerYear: event.accountState.postTaxAmountNeededPerYear,
        interestRate: event.accountState.interestRate,
        income: event.accountState.income,
        province: event.accountState.province,
        dividendYield: event.accountState.dividendYield,
        accounts: event.accountState.accounts.map(acc => ({
          accountName: acc.accountName,
          principalAmount: acc.principalAmount,
          capitalGainsAmount: acc.capitalGainsAmount,
          capitalGainAmount: acc.capitalGainsAmount,
          totalValue: acc.totalValue,
          isAmountTaxable: acc.isAmountTaxable,
          isCapitalGainsTaxable: acc.isCapitalGainsTaxable,
          capitalGainsTaxablePercentage: acc.capitalGainsTaxablePercentage
        })),
        accountsList: event.accountState.accountsList
      },
      year: event.year,
      preTaxAmounts: event.preTaxAmounts,
      taxableAmount: event.taxableAmount,
      isInfinite: event.isInfinite,
      dividends: event.dividends,
      dividendTaxable: event.dividendTaxable
    };
  }

  computeBurndownMinimization(form: any): any[] | null {
    const startingState = this.createAccountStateFromForm(form);
    const events = computeBurndownMinimization(startingState, this.useRealBrackets);
    if (!events) return null;
    return events.map(e => this.serializeEvent(e));
  }

  computeBurndownSimulation(form: any): any[] | null {
    const startingState = this.createAccountStateFromForm(form);
    const withdrawals = [
      Number(form.tfsaWithdraw || 0),
      Number(form.rrspWithdraw || 0),
      Number(form.margWithdraw || 0)
    ];
    const startingYear = Number(form.startingYear || 0);
    const events = computeBurndownSimulation(startingState, withdrawals, startingYear);
    if (!events) return null;
    return events.map(e => this.serializeEvent(e));
  }
}
