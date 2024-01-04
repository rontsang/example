package com.example.demo.service;

import com.example.demo.model.WithdrawalAmounts;

import java.util.ArrayList;

public class TaxMinimizationService {

    public void main(double TAX_FREE, double TAX_DEFERRED, double TAXABLE) {
        UserAccounts account = initAccount(TAX_FREE, TAX_DEFERRED, TAXABLE);
        taxMinimization(account);
    }

    public void taxMinimization(UserAccounts account){
        OptimizationBracket optimizationBracket = initOptimizationBracket();
        // Optimize i times
        for(int i = 0; i < 3; i++) {
            optimizationBracket = getOptimalBracket(account, optimizationBracket);
        }
    }

    private OptimizationBracket getOptimalBracket(UserAccounts account, OptimizationBracket optimizationBracket) {
        // Loop though percentages of TAX_FREE, TAX_DEFERRED, TAXABLE
        double lowerBoundInnerLoop = optimizationBracket.getTaxDeferredPercentage_lowerBound();
        double upperBoundInnerLoop = optimizationBracket.getTaxDeferredPercentage_upperBound();
        double lowerBoundOuterLoop = optimizationBracket.getTaxablePercentage_lowerBound();
        double upperBoundOuterLoop = optimizationBracket.getTaxDeferredPercentage_upperBound();

        double optimalLowerBoundInnerLoop = 0;
        double optimalUpperBoundInnerLoop = 0;
        double optimalLowerBoundOuterLoop = 0;
        double optimalUpperBoundOuterLoop = 0;
        double optimalYears = 0;

        double innerLoopInterval = (upperBoundInnerLoop-lowerBoundInnerLoop)/5;
        double outerLoopInterval = (upperBoundOuterLoop-lowerBoundOuterLoop)/5;

        OptimizationBracket optimalBracket = new OptimizationBracket();

        for(double i = lowerBoundOuterLoop; i <= upperBoundOuterLoop; i += outerLoopInterval) {
            for(double j = lowerBoundInnerLoop; j <= upperBoundInnerLoop; j += innerLoopInterval) {
                // Calculate years until accounts are empty
                double taxableAmountPreTax = account.getTAXABLE() * i;
                double taxDeferredAmountPreTax = account.getTAX_DEFERRED() * j;
                WithdrawalAmounts withdrawalAmounts = TaxCalculationService.calculateWithdrawalAmounts(taxableAmountPreTax, taxDeferredAmountPreTax);
                double years = calculateYearsUntilAccountsAreEmpty(account, withdrawalAmounts.taxable, withdrawalAmounts.taxDeferred);

                // Store percentages and years
                if(years > optimalYears) {
                    optimalLowerBoundOuterLoop = (i==lowerBoundOuterLoop) ? lowerBoundOuterLoop : lowerBoundOuterLoop-outerLoopInterval;
                    optimalUpperBoundOuterLoop = (i==upperBoundOuterLoop) ? upperBoundOuterLoop : upperBoundOuterLoop+outerLoopInterval;
                    optimalLowerBoundInnerLoop = (j==lowerBoundInnerLoop) ? lowerBoundInnerLoop : lowerBoundInnerLoop-innerLoopInterval;
                    optimalUpperBoundInnerLoop = (j==upperBoundInnerLoop) ? upperBoundInnerLoop : upperBoundInnerLoop+innerLoopInterval;
                    optimalYears = years;
                }
            }
        }
        optimalBracket.setTaxDeferredPercentage_lowerBound(optimalLowerBoundInnerLoop);
        optimalBracket.setTaxDeferredPercentage_upperBound(optimalUpperBoundInnerLoop);
        optimalBracket.setTaxablePercentage_lowerBound(optimalLowerBoundOuterLoop);
        optimalBracket.setTaxablePercentage_upperBound(optimalUpperBoundOuterLoop);
        return optimalBracket;
    }

    // Calculate years until accounts are empty, given:
    // 1. Starting amounts
    // 2. Annual withdrawal amount
    public double calculateYearsUntilAccountsAreEmpty(UserAccounts account, double taxableAmount, double taxDeferredAmount) {
        double years = 0;
        // If all accounts are empty, return 0
        if(account.getTAX_FREE() == 0 && account.getTAX_DEFERRED() == 0 && account.getTAXABLE() == 0) {
            return years;
        }
        // If one account is empty, return years until other accounts are empty
        else if(account.getTAX_FREE() == 0) {
            years = calculateYearsUntilAccountsAreEmpty(account, taxableAmount, taxDeferredAmount);
            return years;
        }
        // Calculate years until TAX_FREE Account is empty
        // Calculate years until TAX_DEFERRED Account is empty
        // Calculate years until TAXABLE Account is empty
        // Take minimum of the three
        // Run taxMinimization on the remaining two accounts
        // Calculate future value on last account
        return years;
    }

    public OptimizationBracket initOptimizationBracket() {
        OptimizationBracket optimizationBracket = new OptimizationBracket();
        optimizationBracket.setTaxDeferredPercentage_lowerBound(0);
        optimizationBracket.setTaxablePercentage_lowerBound(0);
        optimizationBracket.setTaxDeferredPercentage_upperBound(1);
        optimizationBracket.setTaxablePercentage_upperBound(1);
        return optimizationBracket;
    }

    // Intialize account
    public UserAccounts initAccount(double TAX_FREE, double TAX_DEFERRED, double TAXABLE) {
        UserAccounts account = new UserAccounts();

        account.accounts.add(new TaxFreeAccount(TAX_FREE,0));
        account.accounts.add(new TaxableAccount(TAX_DEFERRED,0));
        account.accounts.add(new TaxDeferredAccount(TAXABLE,0));

        account.postTaxAmountNeededPerYear = 50000;
        account.interestRate = 0.05;
        return account;
    }


}

// Data structure to hold account amounts and capital gains
class UserAccounts {
    double postTaxAmountNeededPerYear;
    double interestRate;
    ArrayList<Account> accounts = new ArrayList<>();
}

class Account{
    boolean isAmountTaxable = false;
    boolean isCapitalGainsTaxable = false;
    double principalAmount = 0;
    double capitalGainsAmount = 0;
    double capitalGainsTaxPercentage = 0;

    public Account(double principal, double capitalGains) {
        principalAmount = principal;
        capitalGainsAmount = capitalGains;
    }
}

class TaxableAccount extends Account{
    boolean isAmountTaxable = true;
    boolean isCapitalGainsTaxable = true;
    double capitalGainsTaxPercentage = 0.50;

    public TaxableAccount(double principal, double capitalGains) {
        super(principal, capitalGains);
    }
}

class TaxFreeAccount extends Account{
    public TaxFreeAccount(double principal, double capitalGains) {
        super(principal, capitalGains);
    }
}

class TaxDeferredAccount extends Account {
    boolean isCapitalGainsTaxable = true;
    boolean isAmountTaxable = true;
    double capitalGainsTaxPercentage = 1;

    public TaxDeferredAccount(double principal, double capitalGains) {
        super(principal, capitalGains);
    }
}
// Data structure to hold optimization bracket
 class OptimizationBracket {
    public double getTaxDeferredPercentage_lowerBound() {
        return taxDeferredPercentage_lowerBound;
    }

    public void setTaxDeferredPercentage_lowerBound(double taxDeferredPercentage_lowerBound) {
        this.taxDeferredPercentage_lowerBound = taxDeferredPercentage_lowerBound;
    }

    public double getTaxablePercentage_lowerBound() {
        return taxablePercentage_lowerBound;
    }

    public void setTaxablePercentage_lowerBound(double taxablePercentage_lowerBound) {
        this.taxablePercentage_lowerBound = taxablePercentage_lowerBound;
    }

    public double getTaxDeferredPercentage_upperBound() {
        return taxDeferredPercentage_upperBound;
    }

    public void setTaxDeferredPercentage_upperBound(double taxDeferredPercentage_upperBound) {
        this.taxDeferredPercentage_upperBound = taxDeferredPercentage_upperBound;
    }

    public double getTaxablePercentage_upperBound() {
        return taxablePercentage_upperBound;
    }

    public void setTaxablePercentage_upperBound(double taxablePercentage_upperBound) {
        this.taxablePercentage_upperBound = taxablePercentage_upperBound;
    }

    double taxDeferredPercentage_lowerBound;
    double taxablePercentage_lowerBound;
    double taxDeferredPercentage_upperBound;
    double taxablePercentage_upperBound;
}

