package com.example.demo;

public class FinanceUtility {
    //rewrite to have decimal years instead of integer years

    // TODO implement monthly withdrawals, so interest payments are not lump sums at the start

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
                double partial = balance / annualWithdrawal;
                balance *= 1 + annualReturnRate * partial;
                years += balance / annualWithdrawal;
            }
            balance = yearEndBalance;
        }
        return years;
    }


    // Calculates the final value of an account given:
    // @param balance - The starting amount in the account
    // @param annualReturnRate - The annual return rate of the account
    // @param years - The number of years to calculate the final value for
    // @param annualWithdrawal - The annual withdrawal from the account
    public static double calcFinalValue(double balance, double annualReturnRate, double years, double annualWithdrawal) {
        // Loop to simulate each year's withdrawal and return
        for (int i = 1; i < years; i++) {
            balance = balance * (1 + annualReturnRate) - annualWithdrawal;
        }

        // Calculate the final year's return
        // E.g. if years = 1.5, then the final "year" is only 0.5, calculate only 50% of the annual return and withdrawal
        double finalYearPercentage = years - (int)years;
        balance = balance * (1 + annualReturnRate*finalYearPercentage) - annualWithdrawal*finalYearPercentage;

        return balance;
    }
}
