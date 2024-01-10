package com.example.demo;

public class FinanceUtility {
    //rewrite to have decimal years instead of integer years

    public static double calcYearsUntilDepletion(double balance, double annualWithdrawal, double annualReturnRate) {
        double years = 0;
        double MAX_YEARS = 50;
        while (balance > 0) {
            double yearEndBalance = balance * (1 + annualReturnRate) - annualWithdrawal;
            if (yearEndBalance >= balance || years > MAX_YEARS) {
                years = Double.MAX_VALUE;
                break;
            }
            if (yearEndBalance > 0) {
                years++;
            } else {
                years += balance / annualWithdrawal;
            }
            balance = yearEndBalance;
        }
        return years;
    }

    public static double calcFinalValue(double balance, double annualReturnRate, double years, double annualWithdrawal) {
        for (int i = 1; i < years; i++) {
            balance = balance * (1 + annualReturnRate) - annualWithdrawal;
        }
        //Add final year's return
        double decimalPortion = years - (int)years;
        balance = balance * (1 + annualReturnRate*decimalPortion) - annualWithdrawal*decimalPortion;

        return balance;
    }
}
