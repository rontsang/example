package com.example.demo.model;

import java.io.Serializable;

public class TaxDeferredAccount extends Account implements Serializable {

    public TaxDeferredAccount(double principal, double capitalGains) {
        super(principal, capitalGains, "RRSP");
        isAmountTaxable = true;
        isCapitalGainsTaxable = true;
        capitalGainsTaxablePercentage = 1.00;
    }
}
