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
    static int debugScenario = 0;
    static int intervalSize = 2;
    static int iterationsPerScenario = 2;

    public static void main(User user) {
        ScenarioNode root = new ScenarioNode.Builder()
                .setUser(user)
                .setAccounts(user.getAccountsList()) //TODO delete
                .setLevel(1)
                .setResult(new Results())
                .build();

        taxMinimization(root);
    }

    public static void taxMinimization(ScenarioNode root) {
        ArrayList<OptimizationWindow> optimizationWindows = OptimizationWindow.init(root.accounts.size());

        List<Integer> debugChain = new ArrayList<>(); //TODO delete once tree is implemented, we will need getParent method to get debugChain

        getOptimalBracket(root, optimizationWindows);

        root.displayResults();

        System.out.println(root);
    }

    private static void getOptimalBracketLooper(ScenarioNode originalNode, ArrayList<OptimizationWindow> optimizationWindows) {
        ArrayList<Double> optimalPoint;
        ScenarioNode nodeToOptimize;

        for (int i = 1; i <= iterationsPerScenario; i++) {
            System.out.println("Optimization Level: " + i);

            nodeToOptimize = originalNode.optimizedNodes.size() == 0 ? originalNode : originalNode.optimizedNodes.get(i - 1);

            // Optimize: find window with the highest years to depletion
            getOptimalBracket(nodeToOptimize, optimizationWindows);

            // Setup next iteration: Take results and shrink optimization window around optimal window for next loop
            // i.e. Fine tune the results to get a more accurate optimal window
            setNextOptimizationWindow(optimizationWindows, nodeToOptimize);

            // Make new node
            originalNode.optimizedNodes.add(originalNode.cloneNodeWithoutChildren());
        }
    }

    private static void setNextOptimizationWindow(ArrayList<OptimizationWindow> optimizationWindows, ScenarioNode nodeToOptimize) {
        ArrayList<Double> optimalPoint;
        ScenarioNode optimalChild = nodeToOptimize.findOptimalChild();
        optimalPoint = optimalChild.result.calculationPoint;

        for (int j = 0; j < nodeToOptimize.user.accounts.size(); j++) {
            Double point = optimalPoint.get(j);
            System.out.println("Optimal Point " + j + " is: " + point);
            Double intervalShift = 1 / (intervalSize * Math.pow(2, j + 1));
            optimizationWindows.get(j).upperBound = point == 1 ? 1 : point + intervalShift;
            optimizationWindows.get(j).lowerBound = point == 0 ? 0 : point - intervalShift;
        }
    }

    private static void getOptimalBracket(ScenarioNode parent, ArrayList<OptimizationWindow> optimizationWindows) {
        if (debugScenario == 1) {
            "".getClass();
        }
        generateChildNodesForOptimizationWindows(parent, optimizationWindows);
        calculateNode(parent);
        parent.findMaximumYearsToDepletionFromResults();
    }

    private static void calculateNode(ScenarioNode node) {
        ArrayList<OptimizationWindow> optimizationWindows = OptimizationWindow.init(node.accounts.size());

        if (node.user.accounts.size() >= 2) {
            getOptimalBracketLooper(node, optimizationWindows); // Add a new level that calculates the optimal bracket for the remaining accounts
        } else {
            getOptimalBracket(node, optimizationWindows);
        }
    }


    private static void generateChildNodesForOptimizationWindows(ScenarioNode parent, ArrayList<OptimizationWindow> optimizationWindows) {
        // Step 1. Calculate percentages of accounts
        int numAccounts = parent.accounts.size();

        // Step 1.1 Generate the scenarios we want to calculate
        List<List<Float>> scenarioPermutations = generatePermutations(numAccounts, intervalSize);

        // Loop through each scenario, adjust optimization window bounds, and create a child node
        for (List<Float> scenario : scenarioPermutations) {
            System.out.println("Scenario: " + debugScenario++);

            ScenarioNode child = new ScenarioNode.Builder()
                    .setUser(parent.user)
                    .setAccounts(parent.accounts)
                    .setLevel(parent.level + 1)
                    .setDebugScenario(debugScenario)
                    .setResult(new Results())
                    .build();

            calculatePostTaxAmounts(parent, optimizationWindows, scenario);
            calculatePreTaxAmounts(parent);

            double year = calculateYearsUntilAccountsAreEmpty(parent);

//            resultsSummary.user = account;
//            resultsSummary.accounts = account.accounts.stream().map(acc -> acc.accountName).collect(Collectors.toList());
//            resultsSummary.saveResults(result, postTaxAmounts, year);
        }
    }

    private static void calculatePostTaxAmounts(ScenarioNode parent, ArrayList<OptimizationWindow> optimizationWindows, List<Float> scenario) {
        ArrayList<Double> postTaxAmounts = new ArrayList<>(parent.accounts.size());
//            Results result = new Results(); // Create new results object for this optimization bracket
//            syslog1(account, scenarioPermutations, scenario);
        List<Float> adjustedCalculation = new ArrayList<>(Collections.nCopies(parent.accounts.size(), (float) 0.0));

        // Step 1 part B
        // Calculate the adjusted percentages for each account + bracket
        for (int accountNumber = 0; accountNumber < parent.accounts.size(); accountNumber++) {
            double lowerBound = optimizationWindows.get(accountNumber).lowerBound;
            double upperBound = optimizationWindows.get(accountNumber).upperBound;
            double range = upperBound - lowerBound;
            double adjustedPercentage = 0;


            if (accountNumber == scenario.size() - 1) {
                adjustedPercentage = 1 - adjustedCalculation.stream().mapToDouble(Float::doubleValue).sum();
                adjustedCalculation.set(accountNumber, (float) adjustedPercentage);
            } else {
                adjustedPercentage = lowerBound + (scenario.get(accountNumber) * range);
                adjustedCalculation.set(accountNumber, (float) adjustedPercentage);
            }

            scenario.set(accountNumber, (float) adjustedPercentage);
            parent.result.postTaxAmounts.add(parent.user.postTaxAmountNeededPerYear * adjustedPercentage);
            parent.result.calculationPoint.add(adjustedPercentage);

            // Used calculated percentages to calculate how much to withdraw from each account
            postTaxAmounts.add(parent.result.postTaxAmounts.get(accountNumber) * adjustedPercentage);
        }
        System.out.println(parent.result.calculationPoint);
        System.out.println("Post Tax Amounts for each account: " + postTaxAmounts);
    }


    // Calculate years until accounts are empty, given:
    // 1. Starting amounts
    // 2. Annual withdrawal amount
    public static double calculateYearsUntilAccountsAreEmpty(ScenarioNode parent) {
        // CREATE RESULTS OBJECT TO STORE RESULTS OF CURRENT PARENT NODE
        calculateUntilFirstAccountDepletes(parent);

        // GENERATE CHILD NODE TO CALCULATE FOR REMAINING ACCOUNTS
        generateChildNodeForRemainingAccounts(parent);

        // CALCULATE CHILDREN NODES
        calculateNode(parent.getChild(0));

        return parent.result.yearsToDepletion;
    }

    private static void calculatePreTaxAmounts(ScenarioNode node) {
//        double years = 0;
        ArrayList<Double> taxableAmounts = new ArrayList<>();

        // Step 1. Calculate taxable amounts for each account
        // We know how much we want to simulate withdrawing from each account in this node
        // We need to calculate how much of that amount is taxable
        double afterTaxTotalTaxable = getAfterTaxTotalTaxable(node, taxableAmounts);

        // Step 2. Calculate pre-tax withdrawal amounts per account based on afterTaxTotalTaxable
        // We have the total taxable dollars to withdraw and after income tax
        // We need to calculate how much we need to withdraw from each account to get that amount
        double preTaxTotal = TaxCalculationService.calculatePreTaxAmount(afterTaxTotalTaxable);

        // Step 3 Calculate total withdrawal amounts. Withdrawal amounts = (1) + (2)
        // 1. PostTaxAmount
        // 2. Distribute the taxes proportionally to all accounts
        ArrayList<Double> withdrawalAmounts = new ArrayList<>();
        for (int i = 0; i < node.accounts.size(); i++) {
            Double withdrawalAmount = node.result.postTaxAmounts.get(i);

            // If there are taxes to add
            if (afterTaxTotalTaxable > 0) {
                withdrawalAmount += (taxableAmounts.get(i) / afterTaxTotalTaxable) * (preTaxTotal - afterTaxTotalTaxable);
            }
            withdrawalAmounts.add(withdrawalAmount);
        }
        System.out.println("Pre Tax Amounts for each account: " + withdrawalAmounts);
        System.out.println("Starting Principal for each account: " + node.user.accounts.stream().map(acc -> acc.principalAmount).toList());
        System.out.println("Starting Capital Gains for each account: " + node.user.accounts.stream().map(acc -> acc.capitalGainsAmount).toList());

        node.result.preTaxAmounts = withdrawalAmounts;
    }

    private static double getAfterTaxTotalTaxable(ScenarioNode node, ArrayList<Double> taxableAmounts) {
        double afterTaxTotalTaxable = 0;
        for (int i = 0; i < node.user.accounts.size(); i++) {
            Account account = node.user.accounts.get(i);
            double taxableAmount = 0.0;
            double accountTotal = account.principalAmount + account.capitalGainsAmount;
            double amountFromPrincipal = node.result.postTaxAmounts.get(i) * (account.principalAmount / accountTotal);
            double amountFromCapitalGains = node.result.postTaxAmounts.get(i) * (account.capitalGainsAmount / accountTotal);

            if (account.isAmountTaxable) {
                taxableAmount += amountFromPrincipal;
            }
            if (account.isCapitalGainsTaxable) {
                taxableAmount += amountFromCapitalGains * account.capitalGainsTaxablePercentage;
            }
            node.result.taxableAmounts.add(taxableAmount);
            taxableAmounts.add(taxableAmount); //TODO delete and just add to afterTaxTotalTaxable
            afterTaxTotalTaxable += taxableAmount;
        }
        return afterTaxTotalTaxable;
    }

    private static void calculateUntilFirstAccountDepletes(ScenarioNode parent) {
        // Calculate time to depletion of each account
        if (parent.user.accounts.size() == 1) {
            //return time to depletion of single/last-remaining account
            "".getClass();
            parent.result.yearsToDepletion = ScenarioUtility.getYearsUntilDepletion(parent.user.accounts.get(0), parent.result.preTaxAmounts.get(0), parent.user.interestRate);
            System.out.println("Years until depletion for last remaining account: " + parent.result.yearsToDepletion);
        } else {
            // Calculate time to depletion of each account and find first account that depletes
            ScenarioUtility.calculateYearsUntilFirstAccountDepletes(parent);

            if (parent.result.yearsToDepletion == Double.MAX_VALUE) {
                //TODO code infinite money case
                parent.result.yearsToDepletion = Double.MAX_VALUE; // You have infinite money glitch
            }

            System.out.println("Years until depletion: " + parent.result.yearsToFirstAccountDepletion);
            System.out.println("Depleted account: " + parent.user.accounts.get(parent.result.indexOfFirstAccountDepletion).accountName);
        }
    }

    // Generate a single child node for the scenario after the first account depletes
    private static void generateChildNodeForRemainingAccounts(ScenarioNode parent) {
        User childUser = new User.Builder()
                .withPostTaxAmountNeededPerYear(parent.user.postTaxAmountNeededPerYear)
                .withInterestRate(parent.user.interestRate)
                .build();

        // For each non-depleted account, calculate the end state of that account after the first account depletes
        for (int i = 0; i < parent.user.accounts.size(); i++) {
            if (i != parent.result.indexOfFirstAccountDepletion && parent.user.accounts.get(i).getTotalValue() > 0) {
                // Calculate FV of account i
                Account endingAccount = calculateEndingAccount(parent, i);
                childUser.accounts.add(endingAccount);

                ScenarioNode child = new ScenarioNode.Builder()
                        .setUser(childUser)
                        .setAccounts(childUser.accounts.stream().map(acc -> acc.accountName).collect(Collectors.toList()))
                        .setLevel(parent.level + 1)
                        .setDebugScenario(debugScenario)
                        .setResult(new Results())
                        .build();

                parent.addChild(child);
            }
        }
        System.out.println("End Principal for each remaining account: " + childUser.accounts.stream().map(acc -> acc.principalAmount).toList());
        System.out.println("End Capital Gains for each remaining account: " + childUser.accounts.stream().map(acc -> acc.capitalGainsAmount).toList());
    }

    private static Account calculateEndingAccount(ScenarioNode parent, int i) {
        Account startingAccount = parent.user.accounts.get(i);
        double startingAmount = startingAccount.principalAmount + startingAccount.capitalGainsAmount;
        double ratioPrincipal = startingAccount.principalAmount / startingAmount;
        double ratioCapitalGains = startingAccount.capitalGainsAmount / startingAmount;

        // TODO calculate capital gains during the period to account for ratio
        // TODO Otherwise we can get negative numbers in principal

        double preTaxAmount = parent.result.preTaxAmounts.get(i);
        double years = parent.result.yearsToFirstAccountDepletion;
        double futureValue = FinanceUtility.calcFinalValue(startingAmount, parent.user.interestRate, years, preTaxAmount);

        double totalTakenFromPrincipal = preTaxAmount * ratioPrincipal * years;
        double futureValuePrincipal = startingAccount.principalAmount - totalTakenFromPrincipal;
        double futureValueCapitalGains;

        if (futureValue > startingAmount) {
            // Account has grown
            double growth = futureValue - startingAmount;
            futureValueCapitalGains = startingAccount.capitalGainsAmount + growth + totalTakenFromPrincipal;
        } else {
            // Account has shrunk
            futureValueCapitalGains = startingAccount.capitalGainsAmount - (preTaxAmount * ratioCapitalGains * years);
            if (futureValuePrincipal < 0) {
                // Account has been depleted
                // Take money from capital gains
                futureValueCapitalGains -= futureValuePrincipal;
                futureValuePrincipal = 0;
            }
        }

        //set flags
        // need to computer future value of prinicpal and capital gains
        Account endingAccount = new Account(futureValuePrincipal, futureValueCapitalGains, startingAccount.accountName);
        endingAccount.isAmountTaxable = startingAccount.isAmountTaxable;
        endingAccount.isCapitalGainsTaxable = startingAccount.isCapitalGainsTaxable;
        endingAccount.capitalGainsTaxablePercentage = startingAccount.capitalGainsTaxablePercentage;
        return endingAccount;
    }

    private static void syslog1(ScenarioNode node, List<List<Float>> combinationsMatrix, List<Float> combination) {
        System.out.println("=============================================");
//        if (combination.size() == 3) {
//            majorCombination++;
//            System.out.println("Calculating Major Combination: " + majorCombination + " of " + combinationsMatrix.size());
//        } else if (combination.size() == 2) {
//            System.out.println("Major combination: " + majorCombination + " of 15");
//            System.out.println("Calculating Minor Combination " + minorCombination + " of " + combinationsMatrix.size());
//            minorCombination++;
//            if (minorCombination == 6) {
//                minorCombination = 1;
//            }
//        }

        // Print name of accounts being calculated
        for (int accountNumber = 0; accountNumber < combination.size(); accountNumber++) {
            System.out.println("Account " + accountNumber + " = " + node.user.accounts.get(accountNumber).accountName);
        }
        System.out.println(combination);
    }
}


