package com.example.demo.model;

import com.example.demo.service.ScenarioNode;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

// Data structure to hold account amounts and capital gains
public class AccountState {
    public double postTaxAmountNeededPerYear;
    public double interestRate;
    public ArrayList<Account> accounts = new ArrayList<>();

    public AccountState(){}
    public AccountState(double TAX_FREE, double TAX_DEFERRED, double TAXABLE, double postTaxAmountNeededPerYear, double interestRate) {
        this.accounts.add(new TaxFreeAccount(TAX_FREE,0));
        this.accounts.add(new TaxDeferredAccount(TAX_DEFERRED,0));
        this.accounts.add(new TaxableAccount(TAXABLE,500000));

        this.postTaxAmountNeededPerYear = postTaxAmountNeededPerYear;
        this.interestRate = interestRate;
    }

    public List<String> getAccountsList() {
        return this.accounts.stream().map(acc -> acc.accountName).collect(Collectors.toList());
    }

    /*
    Usage
    User user = new User.Builder()
    .withPostTaxAmountNeededPerYear(30000)
    .withInterestRate(0.05)
    .addAccount(new TaxFreeAccount(100000, 0))
    .addAccount(new TaxDeferredAccount(200000, 0))
    .addAccount(new TaxableAccount(300000, 500000))
    .build();
     */
    // Builder static inner class
    public static class Builder {
        private double postTaxAmountNeededPerYear;
        private double interestRate;
        private ArrayList<Account> accounts = new ArrayList<>();

        public Builder withPostTaxAmountNeededPerYear(double value) {
            this.postTaxAmountNeededPerYear = value;
            return this;
        }

        public Builder withInterestRate(double value) {
            this.interestRate = value;
            return this;
        }

        public Builder addAccount(Account account) {
            this.accounts.add(account);
            return this;
        }

        public Builder addAccounts(ArrayList<Account> accounts) {
            this.accounts = accounts;
            return this;
        }

        public AccountState build() {
            AccountState user = new AccountState();
            user.postTaxAmountNeededPerYear = this.postTaxAmountNeededPerYear;
            user.interestRate = this.interestRate;
            user.accounts.addAll(this.accounts);
            return user;
        }
    }

    public AccountState cloneAccountState(){
        ArrayList<Account> accountsCopy = new ArrayList<>();
        for (Account account : this.accounts) {
            // Clone individual accounts, assuming Account has a proper clone method
            accountsCopy.add(account.clone());
        }

        return new AccountState.Builder()
                .addAccounts(accountsCopy)
                .withInterestRate(this.interestRate)
                .build();
    }
}
