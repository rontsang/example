package com.example.demo.service;

import com.example.demo.FinanceUtility;
import com.example.demo.model.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import static com.example.demo.service.ScenarioUtility.generatePermutations;

// TODO Optimize infinite money case
// TODO recalculate taxes ever withdrawal based on capital gain differences
// TODO compute combined taxes for Country and Province
// TODO Volatility factors
//      TODO add inflation
//      TODO Return rate

@Service
public class TaxMinimizationService {
    static int majorCombination = 0;
    static int minorCombination = 1;
    static int debugScenario = 0;
    static int intervalSize = 4;
    static int iterationsPerScenario = 4;

    public static void main(double TAX_FREE, double TAX_DEFERRED, double TAXABLE) {
        User account = new User(TAX_FREE, TAX_DEFERRED, TAXABLE, 175000, 0.05);
        taxMinimization(account);
    }

    public static void taxMinimization(User account){
        ArrayList<OptimizationWindow> optimizationWindows = account.accounts.stream()
                .map(acc -> OptimizationWindow.init()).collect(Collectors.toCollection(ArrayList::new));
        List<Integer> debugChain = new ArrayList<>();
        ResultsSummary resultsSummary = getOptimalBracketLooper(account, optimizationWindows, 0, debugChain);
        resultsSummary.displayResults();
        System.out.println(resultsSummary);
    }

    private static ResultsSummary getOptimalBracketLooper(User account, ArrayList<OptimizationWindow> optimizationWindows, Integer level, List<Integer> debugChain) {
        ArrayList<Double> optimalPoint;

        ResultsSummary resultsSummary = new ResultsSummary();
        resultsSummary.level = level;
        resultsSummary.debugChain = debugChain;
        resultsSummary.debugChain.add(debugScenario);

        for(int i = 1; i <= iterationsPerScenario; i++) {
            System.out.println("Optimization Level: " + i);

            // Optimize: find window with the highest years to depletion
            resultsSummary = getOptimalBracket(account, optimizationWindows, resultsSummary.level++, debugChain);

            // Setup next iteration: Take results and shrink optimization window around optimal window for next loop
            // I.e. Fine tune the results to get a more accurate optimal window
            int optimalBracketIndex = resultsSummary.getMaxValueIndex();
            optimalPoint = resultsSummary.resultsList.get(optimalBracketIndex).calculationPoint;

            for (int j = 0; j < account.accounts.size(); j++) {
                Double point = optimalPoint.get(j);
                System.out.println("Optimal Point " + j + " is: " + point);
                Double intervalShift = 1/(intervalSize*Math.pow(2, j+1));
                optimizationWindows.get(j).upperBound = point == 1 ? 1:point + intervalShift;
                optimizationWindows.get(j).lowerBound = point == 0 ? 0:point - intervalShift;
            }
        }
        return resultsSummary;
    }

    private static ResultsSummary getOptimalBracket(User account, ArrayList<OptimizationWindow> optimizationWindows, Integer level, List<Integer> debugChain) {
        ResultsSummary resultsSummary = new ResultsSummary();
        resultsSummary.level = level;
        resultsSummary.debugChain = debugChain;
        resultsSummary.debugChain.add(debugScenario);

        // Step 1. Calculate percentages of accounts
        int numberOfAccounts = account.accounts.size();

        // Step 1 part A
        List<List<Float>> calculationPermutations = generatePermutations(numberOfAccounts, 4);

        // Loop through combinations and adjust based on optimizationBrackets bounds
        for(List<Float> calculation : calculationPermutations) {
            if(debugScenario == 1962){
                "".getClass();
            }
            System.out.println("Scenario: " + debugScenario++);

            Results result = new Results(); // Create new results object for this optimization bracket
            result.debugScenario = debugScenario;

            ArrayList<Double> postTaxAmounts = new ArrayList<>(calculation.size());

            syslog1(account, calculationPermutations, calculation);

            List<Float> adjustedCalculation = new ArrayList<>(Collections.nCopies(calculation.size(), (float) 0.0));
            // Step 1 part B
            // Calculate the adjusted percentages for each account + bracket
            for(int accountNumber = 0; accountNumber < calculation.size(); accountNumber++) {
                double lowerBound = optimizationWindows.get(accountNumber).lowerBound;
                double upperBound = optimizationWindows.get(accountNumber).upperBound;
                double range = upperBound-lowerBound;
                double adjustedPercentage = 0;


                if(accountNumber == calculation.size()-1) {
                    adjustedPercentage = 1 - adjustedCalculation.stream().mapToDouble(Float::doubleValue).sum();
                    adjustedCalculation.set(accountNumber, (float) adjustedPercentage);
                } else {
                    adjustedPercentage = lowerBound + (calculation.get(accountNumber)*range);
                    adjustedCalculation.set(accountNumber, (float) adjustedPercentage);
                }

                calculation.set(accountNumber, (float) adjustedPercentage);
                result.calculationPoint.add(adjustedPercentage);
                // Used calculated percentages to calculate how much to withdraw from each account
                postTaxAmounts.add(account.postTaxAmountNeededPerYear * adjustedPercentage);
            }
            System.out.println(result.calculationPoint);
            System.out.println("Post Tax Amounts for each account: " + postTaxAmounts);

            double year = calculateYearsUntilAccountsAreEmpty(account, postTaxAmounts, result);

            resultsSummary.user = account;
            resultsSummary.accounts = account.accounts.stream().map(acc -> acc.accountName).collect(Collectors.toList());
            resultsSummary.saveResults(result, postTaxAmounts, year);
        }
        System.out.println("=============================================");

        resultsSummary.findMaximumYearsToDepletionFromResults();

        return resultsSummary;
    }

    private static void syslog1(User account, List<List<Float>> combinationsMatrix, List<Float> combination) {
        System.out.println("=============================================");

        if(combination.size() == 3) {
            majorCombination++;
            System.out.println("Calculating Major Combination: " + majorCombination + " of " + combinationsMatrix.size());
        }
        else if(combination.size() == 2) {
            System.out.println("Major combination: " + majorCombination + " of 15");
            System.out.println("Calculating Minor Combination " + minorCombination + " of " + combinationsMatrix.size());
            minorCombination++;
            if (minorCombination == 6) {
                minorCombination = 1;
            }
        }

        // Print name of accounts being calculated
        for(int accountNumber = 0; accountNumber < combination.size(); accountNumber++) {
            System.out.println("Account " + accountNumber + " = " + account.accounts.get(accountNumber).accountName);
        }
//        System.out.println(combination);
    }

    // Calculate years until accounts are empty, given:
    // 1. Starting amounts
    // 2. Annual withdrawal amount
    public static double calculateYearsUntilAccountsAreEmpty(User user, ArrayList<Double> postTaxAmounts, Results result) {
        double years = 0;
        ArrayList<Double> taxableAmounts = new ArrayList<>();

        double afterTaxTotalTaxable = 0;

        // Step 2. Calculate taxable amounts for each account
        // Step 2 part A
        for(int i = 0; i < user.accounts.size(); i++){
            Account account = user.accounts.get(i);
            double taxableAmount = 0.0;
            double accountTotal = account.principalAmount + account.capitalGainsAmount;
            double amountFromPrincipal = postTaxAmounts.get(i) * (account.principalAmount/accountTotal);
            double amountFromCapitalGains = postTaxAmounts.get(i) * (account.capitalGainsAmount/accountTotal);

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
        ArrayList<Double> withdrawalAmounts = new ArrayList<>();
        for(int i = 0; i < user.accounts.size(); i++){
            Double withdrawalAmount = postTaxAmounts.get(i);
            // If there are taxes to add
            if(afterTaxTotalTaxable > 0){
                withdrawalAmount += (taxableAmounts.get(i)/afterTaxTotalTaxable) * (preTaxTotal-afterTaxTotalTaxable);
            }
            withdrawalAmounts.add(withdrawalAmount);
        }
        System.out.println("Pre Tax Amounts for each account: " + withdrawalAmounts);
        System.out.println("Starting Principal for each account: " + user.accounts.stream().map(acc -> acc.principalAmount).toList());
        System.out.println("Starting Capital Gains for each account: " + user.accounts.stream().map(acc -> acc.capitalGainsAmount).toList());
        result.preTaxAmounts = withdrawalAmounts;

        // Step 3
        if(user.accounts.size() == 1){
            //return FT of single account
            years = ScenarioUtility.getYearsUntilDepletion(user.accounts.get(0), withdrawalAmounts.get(0), user.interestRate);
            System.out.println("Years until depletion: " + years);
            result.resultsSummary.yearsToDepletion = 0; // no need to calculate next level
        }
        else {
            // Calculate time to depletion of each account

            double[] yearsToDepletion = ScenarioUtility.calculateYearsUntilFirstAccountDepletes(user, withdrawalAmounts);

            if(yearsToDepletion[0] == Double.MAX_VALUE){
                return Double.MAX_VALUE; // You have infinite money glitch
            }

            double yearsToFirstAccountDepletion = yearsToDepletion[0];
            int indexOfFirstAccountDepletion = (int) yearsToDepletion[1];

            years += yearsToFirstAccountDepletion;
            result.yearsToDepletion = years;
            result.indexOfFirstAccountDepletion = indexOfFirstAccountDepletion;

            System.out.println("Years until depletion: " + years);
            System.out.println("Depleted account: " + user.accounts.get(indexOfFirstAccountDepletion).accountName);

            // Calculate FV of remaining account (create new account object)
            // Create new interval object using FV
            // Calculate optimal bracket for remaining accounts (remove depleted account)
            User newAccountRecursion = new User();
            newAccountRecursion.postTaxAmountNeededPerYear = user.postTaxAmountNeededPerYear;
            newAccountRecursion.interestRate = user.interestRate;

            ArrayList<OptimizationWindow> recursiveOptimization = new ArrayList<OptimizationWindow>();

            for (int i = 0; i < user.accounts.size(); i++) {
                if(i != indexOfFirstAccountDepletion && user.accounts.get(i).getTotalValue() > 0){
                    // Calculate FV of each account

                    Account startingAccount = user.accounts.get(i);
                    double startingAmount = startingAccount.principalAmount + startingAccount.capitalGainsAmount;
                    double ratioPrincipal = startingAccount.principalAmount/startingAmount;
                    double ratioCapitalGains = startingAccount.capitalGainsAmount/startingAmount;

                    // TODO calculate capital grains during the period to account for ratio
                    // Otherwise we can get negative numbers in principal
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
                        if(futureValuePrincipal < 0){
                            // Account has been depleted
                            // Take money from capital gains
                            futureValueCapitalGains -= futureValuePrincipal;
                            futureValuePrincipal = 0;
                        }
                    }


                    recursiveOptimization.add(OptimizationWindow.init());

                    //set flags
                    // need to computer future value of prinicpal and capital gains

                    Account endingAccount = new Account(futureValuePrincipal, futureValueCapitalGains, startingAccount.accountName);
                    endingAccount.isAmountTaxable = startingAccount.isAmountTaxable;
                    endingAccount.isCapitalGainsTaxable = startingAccount.isCapitalGainsTaxable;
                    endingAccount.capitalGainsTaxablePercentage = startingAccount.capitalGainsTaxablePercentage;

                    newAccountRecursion.accounts.add(endingAccount);
                }
            }
            System.out.println("End Principal for each remaining account: " + newAccountRecursion.accounts.stream().map(acc -> acc.principalAmount).toList());
            System.out.println("End Capital Gains for each remaining account: " + newAccountRecursion.accounts.stream().map(acc -> acc.capitalGainsAmount).toList());

            if(newAccountRecursion.accounts.size() >= 2){
                result.resultsSummary = getOptimalBracketLooper(newAccountRecursion, recursiveOptimization, result.resultsSummary.level++, result.resultsSummary.debugChain); // Add a new level that calculates the optimal bracket for the remaining accounts
            } else {
                result.resultsSummary = getOptimalBracket(newAccountRecursion, recursiveOptimization, result.resultsSummary.level++, result.resultsSummary.debugChain);
            }
        }
        return years;
    }
}


