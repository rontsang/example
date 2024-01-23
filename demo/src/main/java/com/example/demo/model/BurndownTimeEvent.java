package com.example.demo.model;

public class BurndownTimeEvent {
    public AccountState accountState;
    public double year;

    public BurndownTimeEvent(AccountState startingAccountState, double year) {
        this.accountState = startingAccountState;
        this.year = year;
    }
}
