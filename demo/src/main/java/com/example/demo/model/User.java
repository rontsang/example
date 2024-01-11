package com.example.demo.model;

import com.example.demo.service.TaxFreeAccount;

import java.util.ArrayList;

// Data structure to hold account amounts and capital gains
public class User {
    public double postTaxAmountNeededPerYear;
    public double interestRate;
    public ArrayList<Account> accounts = new ArrayList<>();

    public User(){}
    public User(double TAX_FREE, double TAX_DEFERRED, double TAXABLE, double postTaxAmountNeededPerYear, double interestRate) {
        this.accounts.add(new TaxFreeAccount(TAX_FREE,0));
        this.accounts.add(new TaxDeferredAccount(TAX_DEFERRED,0));
        this.accounts.add(new TaxableAccount(TAXABLE,500000));

        this.postTaxAmountNeededPerYear = postTaxAmountNeededPerYear;
        this.interestRate = interestRate;
    }
}
