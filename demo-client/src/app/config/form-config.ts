export const FORM_CONFIG = {
  defaults: {
    tfsaAmount: 500000,
    rrspAmount: 500000,
    margAmountPrincipal: 800000,
    margAmountCapitalGain: 400000,
    income: 5000,
    interestRate: 3.0,
    inflationRate: 2.0,
    amountPerYear: 60000,
    dividendYield: 1.0,
    variance: 10,
    province: 'Ontario'
  },
  sliders: {
    tfsaAmount: {
      min: 0,
      max: 2000000,
      step: 10000
    },
    rrspAmount: {
      min: 0,
      max: 2000000,
      step: 10000
    },
    margAmountPrincipal: {
      min: 0,
      max: 2000000,
      step: 10000
    },
    margAmountCapitalGain: {
      min: 0,
      max: 2000000,
      step: 10000
    },
    income: {
      min: 0,
      maxDefault: 20000,
      step: 500
    },
    interestRate: {
      min: 0,
      max: 15,
      step: 0.5
    },
    inflationRate: {
      min: 0,
      max: 10,
      step: 0.1
    },
    amountPerYear: {
      min: 10000,
      max: 300000,
      step: 5000
    },
    dividendYield: {
      min: 0,
      max: 10,
      step: 0.1
    }
  }
};
