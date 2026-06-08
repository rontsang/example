from pydantic import BaseModel
from typing import List, Optional

# --- Request Schemas (Pydantic) ---

class FormData(BaseModel):
    tfsaAmount: float
    rrspAmount: float
    margAmountPrincipal: float
    margAmountCapitalGain: float
    amountPerYear: float
    income: float
    interestRate: float
    province: Optional[str] = "Ontario"

class UserTestFormData(BaseModel):
    tfsaWithdraw: float
    rrspWithdraw: float
    margWithdraw: float
    tfsaAmount: float
    rrspAmount: float
    margAmountPrincipal: float
    margAmountCapitalGain: float
    amountPerYear: float
    income: float
    interestRate: float
    startingYear: float
    province: Optional[str] = "Ontario"


# --- Domain Classes (Plain Python / Pydantic-compatible) ---

class Account:
    def __init__(self, principal: float, capital_gains: float, name: str):
        self.principalAmount = principal
        self.capitalGainsAmount = capital_gains
        self.accountName = name
        self.isAmountTaxable = False
        self.isCapitalGainsTaxable = False
        self.capitalGainsTaxablePercentage = 0.0

        # Set rules based on name to match Java constructor subclasses
        if name == "RRSP":
            self.isAmountTaxable = True
            self.isCapitalGainsTaxable = True
            self.capitalGainsTaxablePercentage = 1.00
        elif name == "MARG":
            self.isAmountTaxable = False
            self.isCapitalGainsTaxable = True
            self.capitalGainsTaxablePercentage = 0.50

    @property
    def totalValue(self) -> float:
        return self.principalAmount + self.capitalGainsAmount

    def getTotalValue(self) -> float:
        return self.principalAmount + self.capitalGainsAmount

    def clone(self) -> 'Account':
        new_acc = Account(self.principalAmount, self.capitalGainsAmount, self.accountName)
        new_acc.isAmountTaxable = self.isAmountTaxable
        new_acc.isCapitalGainsTaxable = self.isCapitalGainsTaxable
        new_acc.capitalGainsTaxablePercentage = self.capitalGainsTaxablePercentage
        return new_acc

    def to_dict(self):
        return {
            "accountName": self.accountName,
            "principalAmount": self.principalAmount,
            "capitalGainsAmount": self.capitalGainsAmount,
            "totalValue": self.totalValue,
            "isAmountTaxable": self.isAmountTaxable,
            "isCapitalGainsTaxable": self.isCapitalGainsTaxable,
            "capitalGainsTaxablePercentage": self.capitalGainsTaxablePercentage
        }


class AccountState:
    def __init__(self, post_tax_amount_needed: float = 0, interest_rate: float = 0, income: float = 0):
        self.postTaxAmountNeededPerYear = post_tax_amount_needed
        self.interestRate = interest_rate
        self.income = income
        self.accounts: List[Account] = []

    @property
    def accountsList(self) -> List[str]:
        return [acc.accountName for acc in self.accounts]

    def cloneAccountState(self) -> 'AccountState':
        clone = AccountState(self.postTaxAmountNeededPerYear, self.interestRate, self.income)
        clone.accounts = [acc.clone() for acc in self.accounts]
        return clone

    def to_dict(self):
        return {
            "postTaxAmountNeededPerYear": self.postTaxAmountNeededPerYear,
            "interestRate": self.interestRate,
            "income": self.income,
            "accounts": [acc.to_dict() for acc in self.accounts],
            "accountsList": self.accountsList
        }


class OptimizationWindow:
    def __init__(self, lower_bound: float = 0.0, upper_bound: float = 1.0):
        self.lowerBound = lower_bound
        self.upperBound = upper_bound

    @staticmethod
    def init_list(size: int) -> List['OptimizationWindow']:
        return [OptimizationWindow(0.0, 1.0) for _ in range(size)]

    def to_dict(self):
        return {
            "lowerBound": self.lowerBound,
            "upperBound": self.upperBound
        }


class BurndownTimeEvent:
    def __init__(self, account_state: AccountState, year: float, pre_tax_amounts: List[float]):
        self.accountState = account_state
        self.year = year
        self.preTaxAmounts = pre_tax_amounts
        self.taxableAmount: List[float] = []
        self.isInfinite = False

    def to_dict(self):
        return {
            "accountState": self.accountState.to_dict(),
            "year": self.year,
            "preTaxAmounts": self.preTaxAmounts,
            "taxableAmount": self.taxableAmount,
            "isInfinite": self.isInfinite
        }


class TaxBracket:
    def __init__(self, index: int, lower_bound: float, upper_bound: Optional[float], rate: float):
        self.index = index
        self.lower_bound = lower_bound
        self.upper_bound = upper_bound
        self.rate = rate

    def to_dict(self):
        return {
            "index": self.index,
            "lower_bound": self.lower_bound,
            "upper_bound": self.upper_bound,
            "rate": self.rate
        }
