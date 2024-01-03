package com.example.demo.service;

import java.util.List;

public class TaxCalculationService {
    private List<TaxBracket> taxBrackets;

    public WithdrawalAmounts calculateWithdrawalAmounts(double taxDeferredPostTax, double taxablePostTax) {
        // Sum up how much is needed pre-tax
        // Pretax total
        // Divide the amounts taken from each account proportionally
            // Calculate percentage RRSP is from Pretax total
            // RRSP Post tax total * percentage is the withdrawal amount
            // MARGIN post tax total * (1-percentage) is the withdrawal amount


//        // Calculate after tax amount for RRSP
//        double taxDeferredPreTax = calculatePreTaxAmount(0, taxDeferredPostTax);
//
//        // Calculate after tax amount for MARGIN
//        // For now average out the extra amounts needed
//        double taxablePreTax = calculatePreTaxAmount(taxDeferredPreTax, taxablePostTax);
        return new WithdrawalAmounts(0, 0);
//        return new WithdrawalAmounts(taxDeferredPreTax, taxablePreTax);
    }

    private double calculatePreTaxAmount(double income, double afterTaxAmount) {
        // Computes how much extra money is needed to withdraw from account to satisfy afterTaxAmount
        // Cycle to current tax bracket
        // Computer how much more money is needed to ensure we have enough
        // If amount exceeds upperBound
            // Recurse

        // Return amount
        return afterTaxAmount;
    }

    // Main method and other classes (TaxBracket, WithdrawalAmounts, etc.) remain the same
}

class WithdrawalAmounts {
    public final double taxDeferred;
    public final double taxable;

    public WithdrawalAmounts(double taxDeferred, double taxable) {
        this.taxDeferred = taxDeferred;
        this.taxable = taxable;
    }
}


enum AccountType {
    TAX_FREE, TAX_DEFERRED, TAXABLE
}

class TaxBracket {
    private double lowerBound;
    private double upperBound;
    private double rate;

    public TaxBracket(double lowerBound, double upperBound, double rate) {
        this.lowerBound = lowerBound;
        this.upperBound = upperBound;
        this.rate = rate;
    }

    public double getLowerBound() {
        return lowerBound;
    }

    public double getUpperBound() {
        return upperBound;
    }

    public double getRate() {
        return rate;
    }
}

