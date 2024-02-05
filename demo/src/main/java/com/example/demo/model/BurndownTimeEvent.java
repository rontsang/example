package com.example.demo.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class BurndownTimeEvent implements Serializable {
    public AccountState accountState;
    public double year;

    public List<Double> taxableAmount;

    public boolean isInfinite;

    public ArrayList<Double> preTaxAmounts;

    public BurndownTimeEvent(AccountState startingAccountState, double year, ArrayList<Double> preTaxAmounts) {
        this.accountState = startingAccountState;
        this.year = year;
        this.preTaxAmounts = preTaxAmounts;
    }

    public BurndownTimeEvent() {

    }
}
