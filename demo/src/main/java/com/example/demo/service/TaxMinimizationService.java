package com.example.demo.service;

import com.example.demo.FinanceUtility;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class TaxMinimizationService {

    public static void main(double TAX_FREE, double TAX_DEFERRED, double TAXABLE) {
        UserAccounts account = initAccount(TAX_FREE, TAX_DEFERRED, TAXABLE);
        taxMinimization(account);
    }

    public static void taxMinimization(UserAccounts account){
        ArrayList<OptimizationBracket> optimizationBrackets = new ArrayList<>(account.accounts.stream()
                .map(acc -> initOptimizationBracket())
                .collect(Collectors.toList()));

        ArrayList<OptimizationBracket> optimalBrackets = new ArrayList<OptimizationBracket>(account.accounts.size());

        // Optimize i times
        for(int i = 0; i < 3; i++) {
            optimalBrackets = getOptimalBracket(account, optimizationBrackets);
        }

        System.out.println(optimalBrackets);
    }

    private static ArrayList<OptimizationBracket> getOptimalBracket(UserAccounts account, ArrayList<OptimizationBracket> optimizationBrackets) {
        // Calculate percentages of accounts
        int numberOfAccounts = account.accounts.size();
        ArrayList<Double> years = new ArrayList<Double>();
        List<List<Float>> combinationsMatrix = generatePermutations(numberOfAccounts, 5);

        // Loop through combinations and adjust based on optimizationBrackets bounds
        for(List<Float> combination : combinationsMatrix) {
            ArrayList<Double> postTaxAmounts = new ArrayList<>(combination.size());

            // Calculate the adjusted percentages for each account + bracket
            for(int accountNumber = 0; accountNumber < combination.size(); accountNumber++) {
                double lowerBound = optimizationBrackets.get(accountNumber).lowerBound;
                double upperBound = optimizationBrackets.get(accountNumber).upperBound;
                double range = upperBound-lowerBound;
                double adjustedPercentage = lowerBound + (combination.get(accountNumber)*range);
                combination.set(accountNumber, (float) adjustedPercentage);

                // Used calculated percentages to calculate how much to withdraw from each account
                postTaxAmounts.add(account.postTaxAmountNeededPerYear * adjustedPercentage);
            }
            double year = calculateYearsUntilAccountsAreEmpty(account, postTaxAmounts);

            // Save years
            years.add(year);
        }
        return optimizationBrackets; //TODO keep track of optimal brackets to return
    }

    private static int getMaxValueIndex(ArrayList<Double> arrayList){
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
    public static double calculateYearsUntilAccountsAreEmpty(UserAccounts user, ArrayList<Double> postTaxAmounts) {
        double years = 0;
        ArrayList<Double> taxableAmounts = new ArrayList<>();

        UserAccounts userAccount = new UserAccounts();
        double afterTaxTotalTaxable = 0;

        // Calculate taxable amounts for each account
        for(int i = 0; i < user.accounts.size(); i++){
            Account account = user.accounts.get(i);
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
            taxableAmounts.add(taxableAmount);
            afterTaxTotalTaxable += taxableAmount;
        }

        // Sum up taxable amounts and calculate pre-tax withdrawal amounts per account
        double preTaxTotal = TaxCalculationService.calculatePreTaxAmount(afterTaxTotalTaxable);

        // Calculate withdrawal amounts. Withdrawal amounts = (1) + (2)
        // 1. postTaxAmount
        // 2. Distribute the taxes proportionally to all accounts
        ArrayList<Double> withdrawalAmounts = new ArrayList();
        for(int i = 0; i < user.accounts.size(); i++){
            Double withdrawalAmount = postTaxAmounts.get(i) + (taxableAmounts.get(i)/afterTaxTotalTaxable) * preTaxTotal;
            withdrawalAmounts.add(withdrawalAmount);
        }

        if(user.accounts.size() == 1){
            //return FT of single account
            years = getYearsUntilDepletion(user.accounts.get(0), withdrawalAmounts, user.interestRate);
        }
        else {
            // Calculate time to depletion of each account

            double[] yearsToDepletion = calculateYearsUntilFirstAccountDepletes(user, postTaxAmounts);

            double yearsToFirstAccountDepletion = yearsToDepletion[0];
            double indexOfFirstAccountDepletion = yearsToDepletion[1];

            // Calculate FV of remaining account (create new account object)
            // Create new interval object using FV
            // Calculate optimal bracket for remaining accounts (remove depleted account)
            UserAccounts newAccountRecursion = new UserAccounts();
            newAccountRecursion.postTaxAmountNeededPerYear = user.postTaxAmountNeededPerYear;
            newAccountRecursion.interestRate = user.interestRate;

            ArrayList<OptimizationBracket> recursiveOptimization = new ArrayList<OptimizationBracket>();
            getOptimalBracket(newAccountRecursion, recursiveOptimization);

            for (int i = 0; i < user.accounts.size(); i++) {
                if(i != indexOfFirstAccountDepletion){
                    // Calculate FT of each account
                    double futureValue = FinanceUtility.calcFinalValue(user.accounts.get(i).principalAmount, user.interestRate, yearsToFirstAccountDepletion, postTaxAmounts.get(i));
                    // Remove the account that drains first
                    recursiveOptimization.add(initOptimizationBracket());
                    //set flags
                    newAccountRecursion.accounts.get(i).principalAmount = futureValue;
                    newAccountRecursion.accounts.get(i).capitalGainsAmount = 0;
                    newAccountRecursion.accounts.get(i).isAmountTaxable = user.accounts.get(i).isAmountTaxable;
                    newAccountRecursion.accounts.get(i).isCapitalGainsTaxable = user.accounts.get(i).isCapitalGainsTaxable;

                    newAccountRecursion.accounts.add(new Account(futureValue, 0)); // TODO need to include captial gains amount
                }
            }

        }

        return years;
    }

    private static double[] calculateYearsUntilFirstAccountDepletes(UserAccounts user, ArrayList<Double> postTaxAmounts) {
        double[] yearsToDepletion = new double[2];

        for (int i = 0; i < user.accounts.size(); i++) {
            double yearsTemp = getYearsUntilDepletion(user.accounts.get(0), postTaxAmounts, user.interestRate);
            if(yearsTemp > yearsToDepletion[0]){
                yearsToDepletion[0] = yearsTemp; //yearsToFirstAccountDepletion
                yearsToDepletion[1] = i; //indexOfFirstAccountDepletion
            }
        }
        return yearsToDepletion;
    }

    private static double getYearsUntilDepletion(Account account, ArrayList<Double> postTaxAmounts, Double interestRate) {
        double years;
        double accountTotal = account.principalAmount + account.capitalGainsAmount;
        double annualWithdrawal = postTaxAmounts.get(0);
        years = FinanceUtility.calcYearsUntilDepletion(accountTotal, annualWithdrawal, interestRate);
        return years;
    }


    public static List<List<Float>> generatePermutations(int size, int intervals) {
        ArrayList<List<Float>> permutations = new ArrayList<>();
        generate(new ArrayList<>(), size, 1.0F, intervals, permutations);
        return permutations;
    }

    private static void generate(ArrayList<Float> current, int size, float remaining, int intervals, ArrayList<List<Float>> permutations) {
        if(permutations.size() == 16){
            "".getClass();
        }
        if (size == 1) {
            current.add(Math.round(remaining* 100.0f) / 100.0f);
            permutations.add(new ArrayList<>(current));
            current.remove(current.size() - 1);
        }
        else {
            float increment = (float) (1.0 / intervals);
            for (int i = 0; i <= intervals; i++) {
                float value = Math.round(i * increment * 100.0f) / 100.0f;
                remaining = Math.round(remaining* 100.0f) / 100.0f;
                if (value <= remaining) { // Add this condition
                    current.add(value);
                    generate(current, size - 1, remaining - value, intervals, permutations);
                    current.remove(current.size() - 1);
                }
            }
        }
    }

    public static OptimizationBracket initOptimizationBracket() {
        OptimizationBracket optimizationBracket = new OptimizationBracket();
        optimizationBracket.lowerBound = 0;
        optimizationBracket.upperBound = 1;
        return optimizationBracket;
    }

    // Intialize account
    public static UserAccounts initAccount(double TAX_FREE, double TAX_DEFERRED, double TAXABLE) {
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
    boolean isAmountTaxable = false;
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
    double upperBound;
    double lowerBound;
}

