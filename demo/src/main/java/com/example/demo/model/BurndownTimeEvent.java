package com.example.demo.model;

import java.io.Serializable;

public class BurndownTimeEvent implements Serializable {
    public AccountState accountState;
    public double year;

    public boolean isInfinite;

    public BurndownTimeEvent(AccountState startingAccountState, double year) {
        this.accountState = startingAccountState;
        this.year = year;
    }

    public BurndownTimeEvent() {

    }
}
