package com.example.demo.model;

import java.io.Serializable;

public class Account implements Serializable {
    public boolean isAmountTaxable = false;
    public boolean isCapitalGainsTaxable = false;
    public double principalAmount = 0;
    public double capitalGainsAmount = 0;
    public double capitalGainsTaxablePercentage = 0;

    public String accountName;

    public Account(double principal, double capitalGains, String name) {
        principalAmount = principal;
        capitalGainsAmount = capitalGains;
        accountName = name;
    }

    public double getTotalValue() {
        return principalAmount + capitalGainsAmount;
    }

    public Account clone() {
        Account newAccount = new Account(this.principalAmount, this.capitalGainsAmount, this.accountName);
        newAccount.isAmountTaxable = this.isAmountTaxable;
        newAccount.isCapitalGainsTaxable = this.isCapitalGainsTaxable;
        return newAccount;
    }
}
