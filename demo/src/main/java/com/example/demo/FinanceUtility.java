package com.example.demo;

public class FinanceUtility {
    //rewrite to have decimal years instead of integer years

    public static double calcYearsUntilDepletion(double balance, double annualWithdrawal, double annualReturnRate) {
        double years = 0;
        double newBalance = balance;
        while (balance > 0) {
            newBalance = balance * (1 + annualReturnRate) - annualWithdrawal;
            if(balance > 0){
                years++;
            } else{
                years += balance/annualWithdrawal;
            }
            balance = newBalance;
        }
        return years;
    }

    public static double calcFinalValue(double balance, double annualReturnRate, double years, double annualWithdrawal) {
        for (int i = 0; i < years; i++) {
            balance = balance * (1 + annualReturnRate) - annualWithdrawal;
        }
        //Add final year's return
        double decimalPortion = years - (int)years;
        balance = balance * (1 + annualReturnRate*decimalPortion) - annualWithdrawal*decimalPortion;

        return balance;
    }
}
