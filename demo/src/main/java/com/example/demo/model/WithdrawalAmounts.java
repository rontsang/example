package com.example.demo.model;

public class WithdrawalAmounts {
    public final double taxDeferred;
    public final double taxable;

    public WithdrawalAmounts(double taxDeferred, double taxable) {
        this.taxDeferred = taxDeferred;
        this.taxable = taxable;
    }
}
