package com.example.demo.model;

import com.example.demo.model.Account;

// TODO recalculate taxes ever withdrawal based on capital gain differences
// TODO compute combined taxes for Country and Province
// TODO Volatility factors
//      TODO add inflation
//      TODO Return rate

public class TaxFreeAccount extends Account{
    public TaxFreeAccount(double principal, double capitalGains) {
        super(principal, capitalGains, "TFSA");
    }
}


