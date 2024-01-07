package com.example.demo.service;

import com.example.demo.FinanceUtility;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaxMinimizationService {
    static int majorCombination = 1;
    static int minorCombination = 1;

    public static void main(double TAX_FREE, double TAX_DEFERRED, double TAXABLE) {
        UserAccounts account = initAccount(TAX_FREE, TAX_DEFERRED, TAXABLE);
        taxMinimization(account);
    }

    public static void taxMinimization(UserAccounts account){
        ArrayList<OptimizationBracket> optimizationBrackets = new ArrayList<>(account.accounts.stream()
                .map(acc -> initOptimizationBracket())
                .collect(Collectors.toList()));

        ArrayList<OptimizationBracket> optimalBrackets = new ArrayList<OptimizationBracket>(account.accounts.size());

        Level level = new Level(null);

        // Optimize i times
        for(int i = 0; i < 3; i++) {
            level = getOptimalBracket(account, optimizationBrackets);
        }

        System.out.println(level);
    }

    private static Level getOptimalBracket(UserAccounts account, ArrayList<OptimizationBracket> optimizationBrackets) {
        Level level = new Level(null);
        Results resultMajor = new Results(null, null, null,  null); // Create new results object for this optimization bracket
        resultMajor.userAccounts = account;

        // Step 1. Calculate percentages of accounts
        int numberOfAccounts = account.accounts.size();
        ArrayList<Double> years = new ArrayList<Double>();

        // Step 1 part A
        List<List<Float>> combinationsMatrix = generatePermutations(numberOfAccounts, 4);

        // Loop through combinations and adjust based on optimizationBrackets bounds
        for(List<Float> combination : combinationsMatrix) {
            Results result = new Results(null, null, null,  null);; // Create new results object for this optimization bracket
            ArrayList<Double> postTaxAmounts = new ArrayList<>(combination.size());

            System.out.println("=============================================");

            if(combination.size() == 3) {
                System.out.println("Calculating Major Combination: " + majorCombination + " of " + combinationsMatrix.size());
                majorCombination++;
            }
            else if(combination.size() == 2) {
                System.out.println("Major combination: " + majorCombination + " of 15");
                System.out.println("Calculating Minor Combination " + minorCombination + " of " + combinationsMatrix.size());
                minorCombination++;
                if (minorCombination == 6) {
                    minorCombination = 1;
                }
            }
            if(majorCombination == 6){
                "".getClass();
            }

            // Print name of accounts being calculated
            for(int accountNumber = 0; accountNumber < combination.size(); accountNumber++) {
                System.out.println("Account 1 = " + account.accounts.get(accountNumber).accountName);
            }

            System.out.println(combination);

            // Step 1 part B
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
            System.out.println("Post Tax Amounts for each account: " + postTaxAmounts);

            double year = calculateYearsUntilAccountsAreEmpty(account, postTaxAmounts, result);

            // Save years
            years.add(year);

//            result = new Results(combination, null, postTaxAmounts, null);
            result.yearsToFirstAccountDepletion = year;
            result.yearsToDepletion = year + result.level.yearsToDepletion;
            resultMajor.resultsList.add(result);
            level.resultsList.add(result);
        }
        System.out.println("=============================================");
        // set level years to depletion to the maximum of level.resultsList.yearsToDepletion
        level.yearsToDepletion = level.resultsList.stream().mapToDouble(v -> v.yearsToDepletion).max().getAsDouble();

        return level;
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
    public static double calculateYearsUntilAccountsAreEmpty(UserAccounts user, ArrayList<Double> postTaxAmounts, Results result) {
        double years = 0;
        ArrayList<Double> taxableAmounts = new ArrayList<>();

        UserAccounts userAccount = new UserAccounts();
        double afterTaxTotalTaxable = 0;

        // Step 2. Calculate taxable amounts for each account
        // Step 2 part A
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

        // Step 2 Part B
        // Sum up taxable amounts and calculate pre-tax withdrawal amounts per account
        double preTaxTotal = TaxCalculationService.calculatePreTaxAmount(afterTaxTotalTaxable);

        // Step 2 Part C
        // Calculate withdrawal amounts. Withdrawal amounts = (1) + (2)
        // 1. postTaxAmount
        // 2. Distribute the taxes proportionally to all accounts
        ArrayList<Double> withdrawalAmounts = new ArrayList();
        for(int i = 0; i < user.accounts.size(); i++){
            Double withdrawalAmount = postTaxAmounts.get(i);
            // If there are taxes to add
            if(afterTaxTotalTaxable > 0){
                withdrawalAmount += (taxableAmounts.get(i)/afterTaxTotalTaxable) * (preTaxTotal-afterTaxTotalTaxable);
            }
            withdrawalAmounts.add(withdrawalAmount);
        }
        System.out.println("Pre Tax Amounts for each account: " + withdrawalAmounts);
        System.out.println("Starting Principal for each account: " + user.accounts.stream().map(acc -> acc.principalAmount).collect(Collectors.toList()));
        System.out.println("Starting Capital Gains for each account: " + user.accounts.stream().map(acc -> acc.capitalGainsAmount).collect(Collectors.toList()));
        result.preTaxAmounts = withdrawalAmounts;

        if(majorCombination == 4 && minorCombination == 4+1){
            "".getClass();
        }
        // Step 3
        if(user.accounts.size() == 1){
            //return FT of single account
            years = getYearsUntilDepletion(user.accounts.get(0), withdrawalAmounts.get(0), user.interestRate);
            result.level.yearsToDepletion = 0;
        }
        else {
            // Calculate time to depletion of each account

            double[] yearsToDepletion = calculateYearsUntilFirstAccountDepletes(user, withdrawalAmounts);

            if(yearsToDepletion[0] == Double.MAX_VALUE){
                return Double.MAX_VALUE; // You have infinite money glitch
            }

            double yearsToFirstAccountDepletion = yearsToDepletion[0];
            int indexOfFirstAccountDepletion = (int) yearsToDepletion[1];

            years += yearsToFirstAccountDepletion;
            result.yearsToDepletion = years;

            System.out.println("Years until depletion: " + years);
            if(Math.abs(years - 6.47405142410715) < 0.1){
                "".getClass();
            }
            System.out.println("Depleted account: " + user.accounts.get(indexOfFirstAccountDepletion).accountName);

            // Calculate FV of remaining account (create new account object)
            // Create new interval object using FV
            // Calculate optimal bracket for remaining accounts (remove depleted account)
            UserAccounts newAccountRecursion = new UserAccounts();
            newAccountRecursion.postTaxAmountNeededPerYear = user.postTaxAmountNeededPerYear;
            newAccountRecursion.interestRate = user.interestRate;

            ArrayList<OptimizationBracket> recursiveOptimization = new ArrayList<OptimizationBracket>();

            for (int i = 0; i < user.accounts.size(); i++) {
                if(i != indexOfFirstAccountDepletion && user.accounts.get(i).getTotalValue() > 0){
                    // Calculate FV of each account

                    Account startingAccount = user.accounts.get(i);
                    double startingAmount = startingAccount.principalAmount + startingAccount.capitalGainsAmount;
                    double ratioPrincipal = startingAccount.principalAmount/startingAmount;
                    double ratioCapitalGains = startingAccount.capitalGainsAmount/startingAmount;
                    double futureValue = FinanceUtility.calcFinalValue(startingAmount, user.interestRate, yearsToFirstAccountDepletion, withdrawalAmounts.get(i));

                    double totalTakenFromPrincipal = withdrawalAmounts.get(i)*ratioPrincipal*yearsToFirstAccountDepletion;
                    double futureValuePrincipal = startingAccount.principalAmount - totalTakenFromPrincipal;
                    double futureValueCapitalGains;

                    if(futureValue > startingAmount){
                        // Account has grown
                        double growth = futureValue - startingAmount;
                        futureValueCapitalGains = startingAccount.capitalGainsAmount + growth + totalTakenFromPrincipal;
                    } else {
                        // Account has shrunk
                        futureValueCapitalGains = startingAccount.capitalGainsAmount - withdrawalAmounts.get(i)*ratioCapitalGains*yearsToFirstAccountDepletion;
                    }


                    recursiveOptimization.add(initOptimizationBracket());

                    //set flags
                    // need to computer future value of prinicpal and capital gains

                    Account endingAccount = new Account(futureValuePrincipal, futureValueCapitalGains, startingAccount.accountName);
                    endingAccount.isAmountTaxable = startingAccount.isAmountTaxable;
                    endingAccount.isCapitalGainsTaxable = startingAccount.isCapitalGainsTaxable;
                    endingAccount.capitalGainsTaxablePercentage = startingAccount.capitalGainsTaxablePercentage;

                    newAccountRecursion.accounts.add(endingAccount);
                }
            }
            System.out.println("End Principal for each remaining account: " + newAccountRecursion.accounts.stream().map(acc -> acc.principalAmount).collect(Collectors.toList()));
            System.out.println("End Capital Gains for each remaining account: " + newAccountRecursion.accounts.stream().map(acc -> acc.capitalGainsAmount).collect(Collectors.toList()));

            result.level = getOptimalBracket(newAccountRecursion, recursiveOptimization); // Add a new level that calculates the optimal bracket for the remaining accounts
        }
        return years;
    }

    private static double[] calculateYearsUntilFirstAccountDepletes(UserAccounts user, ArrayList<Double> annualWithdrawalAmounts) {
        // Array to store
        // [0] = years until depletion
        // [1] = index of account that depletes first
        double[] yearsToDepletion = {Double.MAX_VALUE, 0};

        for (int i = 0; i < user.accounts.size(); i++) {
            double yearsTemp = getYearsUntilDepletion(user.accounts.get(i), annualWithdrawalAmounts.get(i), user.interestRate);
            if(yearsTemp < yearsToDepletion[0]){
                yearsToDepletion[0] = yearsTemp; //yearsToFirstAccountDepletion
                yearsToDepletion[1] = i; //indexOfFirstAccountDepletion
            }
        }
        return yearsToDepletion;
    }

    private static double getYearsUntilDepletion(Account account, Double annualWithdrawal, Double interestRate) {
        double years;
        double accountTotal = account.principalAmount + account.capitalGainsAmount;
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
                if (value <= remaining) {
                    current.add(value);
                    try {
                        generate(current, size - 1, remaining - value, intervals, permutations);
                    } catch (Exception e) {
                        System.out.println("Error");
                        generate(current, size - 1, remaining - value, intervals, permutations);
                    }
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
        account.accounts.add(new TaxDeferredAccount(TAX_DEFERRED,0));
        account.accounts.add(new TaxableAccount(TAXABLE,200000));

        account.postTaxAmountNeededPerYear = 175000;
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

    String accountName;

    public Account(double principal, double capitalGains, String name) {
        principalAmount = principal;
        capitalGainsAmount = capitalGains;
        accountName = name;
    }

    public double getTotalValue(){
        return principalAmount + capitalGainsAmount;
    }
}

class TaxableAccount extends Account{

    public TaxableAccount(double principal, double capitalGains) {
        super(principal, capitalGains, "MARG");
        isAmountTaxable = false;
        isCapitalGainsTaxable = true;
        capitalGainsTaxablePercentage = 0.50;
    }
}

class TaxFreeAccount extends Account{
    public TaxFreeAccount(double principal, double capitalGains) {
        super(principal, capitalGains, "TFSA");
    }
}

class TaxDeferredAccount extends Account {

    public TaxDeferredAccount(double principal, double capitalGains) {
        super(principal, capitalGains, "RRSP");
        isAmountTaxable = true;
        isCapitalGainsTaxable = true;
        capitalGainsTaxablePercentage = 1.00;
    }
}
// Data structure to hold optimization bracket
 class OptimizationBracket {
    double upperBound;
    double lowerBound;
}


