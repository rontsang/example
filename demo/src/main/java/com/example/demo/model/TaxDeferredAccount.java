package com.example.demo.model;

public class TaxDeferredAccount extends Account {

    public TaxDeferredAccount(double principal, double capitalGains) {
        super(principal, capitalGains, "RRSP");
        isAmountTaxable = true;
        isCapitalGainsTaxable = true;
        capitalGainsTaxablePercentage = 1.00;
    }
}
