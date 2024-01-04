package com.example.demo.service;

import java.util.ArrayList;
import java.util.List;

public class TaxMinimizationService {

    public void main(double TAX_FREE, double TAX_DEFERRED, double TAXABLE) {
        UserAccounts account = initAccount(TAX_FREE, TAX_DEFERRED, TAXABLE);
        taxMinimization(account);
    }

    public void taxMinimization(UserAccounts account){
        ArrayList<OptimizationBracket> optimizationBrackets = new ArrayList<>();
        for(int i = 0; i < account.accounts.size(); i++){
            optimizationBrackets.add(initOptimizationBracket());
        }
        OptimizationBracket optimalBracket = initOptimizationBracket();

        // Optimize i times
        for(int i = 0; i < 3; i++) {
            optimalBracket = getOptimalBracket(account, optimizationBrackets);
        }
    }

    private OptimizationBracket getOptimalBracket(UserAccounts account, ArrayList<OptimizationBracket> optimizationBrackets) {
        // Calculate percentages of accounts
        int numberOfAccounts = account.accounts.size();
        ArrayList<Double> years = new ArrayList<Double>();
        List<List<Double>> combinationsMatrix = generateCombinationsMatrix(numberOfAccounts, 5);

        // Loop through combinations and adjust based on optimizationBrackets bounds
        for(List<Double> combination : combinationsMatrix) {
            ArrayList<Double> postTaxAmounts = new ArrayList<>();

            // Calculate the adjusted percentages for each account + bracket
            for(int accountNumber = 0; accountNumber < combination.size(); accountNumber++) {
                double lowerBound = optimizationBrackets.get(accountNumber).lowerBound;
                double upperBound = optimizationBrackets.get(accountNumber).upperBound;
                double interval = (upperBound-lowerBound)/numberOfAccounts;
                double adjustedPercentage = lowerBound + (combination.get(accountNumber)*interval);
                combination.set(accountNumber, adjustedPercentage);

                // Used calculated percentages to calculate how much to withdraw from each account
                postTaxAmounts.add(account.postTaxAmountNeededPerYear * adjustedPercentage);
                double year = calculateYearsUntilAccountsAreEmpty(account, postTaxAmounts);

                // Save years
                years.add(year);
            }
        }
        return optimizationBrackets.get(getMaxValueIndex(years));
    }

    private int getMaxValueIndex(ArrayList<Double> arrayList){
        int maxIndex = 0;
        double maxValue = arrayList.get(0);

        for (int i = 1; i < arrayList.size(); i++) {
            if (arrayList.get(i) > maxValue) {
                maxValue = arrayList.get(i);
                maxIndex = i;
            }
        }
        return maxIndex;
    }


    // Calculate years until accounts are empty, given:
    // 1. Starting amounts
    // 2. Annual withdrawal amount
    public double calculateYearsUntilAccountsAreEmpty(UserAccounts accounts, ArrayList<Double> postTaxAmounts) {
        double years = 0;
        ArrayList<Double> taxableAmounts = new ArrayList<>();

        // Calculate taxable amounts for each account
        for(int i = 0; i < accounts.accounts.size(); i++){
            Account account = accounts.accounts.get(i);
            Double taxableAmount = 0.0;
            Double accountTotal = account.principalAmount + account.capitalGainsAmount;
            Double amountFromPrincipal = postTaxAmounts.get(i) * (account.principalAmount/accountTotal);
            Double amountFromCapitalGains = postTaxAmounts.get(i) * (account.capitalGainsAmount/accountTotal);

            if(account.isAmountTaxable){
                taxableAmount += amountFromPrincipal;
            }
            if(account.isCapitalGainsTaxable){
                taxableAmount += amountFromCapitalGains * account.capitalGainsTaxablePercentage;
            }
            taxableAmounts.add(postTaxAmounts.get(i)/(1-accounts.interestRate));
        }

        // Sum up taxable amounts and calculate pre-tax amounts per account
        // TaxCalculationService.calculateWithdrawalAmounts(taxableAmounts.get(0), taxableAmounts.get(1));

        if(accounts.accounts.size() == 1){
            //return FT of single account
        }
        else {
            // Calculate FT of each account
            // Remove the account that drains first
            // Calculate FV of remaining account (create new account object))
            // Create new interval object using FV
            // Calculate optimal bracket for remaining accounts
        }

        return years;
    }


    private List<List<Double>> generateCombinationsMatrix(int size, double intervals) {
        List<List<Double>> matrix = new ArrayList<>();

        generateMatrix(matrix, new ArrayList<>(), size, 1.0, intervals);

        return matrix;
    }

    private static void generateMatrix(List<List<Double>> matrix, List<Double> currentRow, int n, double remaining, double intervals) {
        double increment = 1/intervals;
        if (n == 1) {
            currentRow.add(remaining);
            matrix.add(new ArrayList<>(currentRow));
            currentRow.remove(currentRow.size() - 1);
        } else {
            for (int i = 0; i <= (int) (remaining / increment); i++) {
                currentRow.add(i * increment);
                generateMatrix(matrix, currentRow, n - 1, remaining - (i * increment), increment);
                currentRow.remove(currentRow.size() - 1);
            }
        }
    }

    public OptimizationBracket initOptimizationBracket() {
        OptimizationBracket optimizationBracket = new OptimizationBracket();
        optimizationBracket.lowerBound = 0;
        optimizationBracket.upperBound = 1;
        return optimizationBracket;
    }

    // Intialize account
    public UserAccounts initAccount(double TAX_FREE, double TAX_DEFERRED, double TAXABLE) {
        UserAccounts account = new UserAccounts();

        account.accounts.add(new TaxFreeAccount(TAX_FREE,0));
        account.accounts.add(new TaxableAccount(TAX_DEFERRED,0));
        account.accounts.add(new TaxDeferredAccount(TAXABLE,0));

        account.postTaxAmountNeededPerYear = 50000;
        account.interestRate = 0.05;
        return account;
    }


}

// Data structure to hold account amounts and capital gains
class UserAccounts {
    double postTaxAmountNeededPerYear;
    double interestRate;
    ArrayList<Account> accounts = new ArrayList<>();
}

class Account{
    boolean isAmountTaxable = false;
    boolean isCapitalGainsTaxable = false;
    double principalAmount = 0;
    double capitalGainsAmount = 0;
    double capitalGainsTaxablePercentage = 0;

    public Account(double principal, double capitalGains) {
        principalAmount = principal;
        capitalGainsAmount = capitalGains;
    }
}

class TaxableAccount extends Account{
    boolean isAmountTaxable = true;
    boolean isCapitalGainsTaxable = true;
    double capitalGainsTaxPercentage = 0.50;

    public TaxableAccount(double principal, double capitalGains) {
        super(principal, capitalGains);
    }
}

class TaxFreeAccount extends Account{
    public TaxFreeAccount(double principal, double capitalGains) {
        super(principal, capitalGains);
    }
}

class TaxDeferredAccount extends Account {
    boolean isCapitalGainsTaxable = true;
    boolean isAmountTaxable = true;
    double capitalGainsTaxPercentage = 1;

    public TaxDeferredAccount(double principal, double capitalGains) {
        super(principal, capitalGains);
    }
}
// Data structure to hold optimization bracket
 class OptimizationBracket {
    public double getTaxDeferredPercentage_lowerBound() {
        return taxDeferredPercentage_lowerBound;
    }

    public void setTaxDeferredPercentage_lowerBound(double taxDeferredPercentage_lowerBound) {
        this.taxDeferredPercentage_lowerBound = taxDeferredPercentage_lowerBound;
    }

    public double getTaxablePercentage_lowerBound() {
        return taxablePercentage_lowerBound;
    }

    public void setTaxablePercentage_lowerBound(double taxablePercentage_lowerBound) {
        this.taxablePercentage_lowerBound = taxablePercentage_lowerBound;
    }

    public double getTaxDeferredPercentage_upperBound() {
        return taxDeferredPercentage_upperBound;
    }

    public void setTaxDeferredPercentage_upperBound(double taxDeferredPercentage_upperBound) {
        this.taxDeferredPercentage_upperBound = taxDeferredPercentage_upperBound;
    }

    public double getTaxablePercentage_upperBound() {
        return taxablePercentage_upperBound;
    }

    public void setTaxablePercentage_upperBound(double taxablePercentage_upperBound) {
        this.taxablePercentage_upperBound = taxablePercentage_upperBound;
    }

    double taxDeferredPercentage_lowerBound;
    double taxablePercentage_lowerBound;
    double taxDeferredPercentage_upperBound;
    double taxablePercentage_upperBound;

    double upperBound;
    double lowerBound;
}

