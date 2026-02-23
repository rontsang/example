package com.example.demo.model;

import com.example.demo.model.Account;

import java.io.Serializable;

// TODO recalculate taxes ever withdrawal based on capital gain differences
// TODO compute combined taxes for Country and Province
// TODO Volatility factors
//      TODO add inflation
//      TODO Return rate

public class TaxFreeAccount extends Account implements Serializable {
    public TaxFreeAccount(double principal, double capitalGains) {
        super(principal, capitalGains, "TFSA");
    }
}


