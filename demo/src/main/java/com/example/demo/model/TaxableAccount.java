package com.example.demo.model;

public class TaxableAccount extends Account {

    public TaxableAccount(double principal, double capitalGains) {
        super(principal, capitalGains, "MARG");
        isAmountTaxable = false;
        isCapitalGainsTaxable = true;
        capitalGainsTaxablePercentage = 0.50;
    }
}
