package com.example.demo.model;

import java.io.Serializable;

public class TaxableAccount extends Account implements Serializable {

    public TaxableAccount(double principal, double capitalGains) {
        super(principal, capitalGains, "MARG");
        isAmountTaxable = false;
        isCapitalGainsTaxable = true;
        capitalGainsTaxablePercentage = 0.50;
    }
}
