package com.example.demo.service;

import com.example.demo.model.Account;
import com.example.demo.model.AccountState;
import com.example.demo.model.BurndownTimeEvent;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

// TODO Optimize infinite money case
// TODO recalculate taxes ever withdrawal based on capital gain differences
// TODO compute combined taxes for Country and Province
// TODO Volatility factors
//      TODO add inflation
//      TODO Return rate

@Service
public class TaxSimulationService {
    static int debugScenario;
    static int intervalSize = 2;
    static int iterationsPerScenario = 4;

    public static ScenarioNode main(AccountState startingState, ArrayList withdrawals, double startingYear) {
        Scenario scenario = new Scenario();
        scenario.preTaxAmounts = withdrawals;

        ScenarioNode root = new ScenarioNode.Builder()
            .setStartingAccountState(startingState)
            .setEndingAccountState(startingState)
            .setAccounts(startingState.getAccountsList()) //TODO delete
            .setLevel(1)
            .setScenario(scenario)
            .build();

//        TaxCalculationService.calculatePreTaxAmounts(root);
        calculateYearsUntilAccountsAreEmpty(root);

//        printOptimalStrategy(root);
            ArrayList<BurndownTimeEvent> burndown = new ArrayList<>();
            root.getOptimalChildAndYearsToDepletion();
        if(root.scenario.yearsToDepletion < 100) {
            burndownStageN(root, burndown, startingYear);
            root.displayResults();

//            root.saveToFile(root, "root.ser");
            root.saveToFile(burndown, "C:\\example\\demo\\burndown.ser");

//        ScenarioNode readNode = (ScenarioNode) root.readToFile("root.ser");
//        ArrayList<BurndownTimeEvent> burndownRead = root.readToFileAl("C:\\tax\\demo\\burndown.ser");

            System.out.println(root);

            return root;
        }
        return null;
    }

    private static void burndownStageN(ScenarioNode currentScenarioNode, ArrayList<BurndownTimeEvent> burndown, double startingYear) {

        ArrayList<BurndownTimeEvent> nextBurnDown = Postprocessor.generateBurndownUntilFirstAccountDepletes(currentScenarioNode.startingAccountState, (ArrayList<Double>) currentScenarioNode.scenario.preTaxAmounts, burndown, startingYear);

        // Print accounts in burn down
        for (BurndownTimeEvent event : nextBurnDown) {
            System.out.println("Year: " + event.year);
            System.out.println("Accounts Principle: " + event.accountState.accounts.stream().map(acc -> acc.principalAmount).toList());
            System.out.println("Accounts Capital Gains: " + event.accountState.accounts.stream().map(acc -> acc.capitalGainsAmount).toList());
        }

        // Append nextBurnDown to previousBurnDown
        for(BurndownTimeEvent event : nextBurnDown){
            event.taxableAmount = new ArrayList<>();
            for(int i = 0; i < event.accountState.accounts.size(); i++){
                double totalTaxable = 0;
                double ratio = event.accountState.accounts.get(i).principalAmount / (event.accountState.accounts.get(i).principalAmount + event.accountState.accounts.get(i).capitalGainsAmount);
                if(event.accountState.accounts.get(i).isAmountTaxable) {
                    totalTaxable += event.preTaxAmounts.get(i) * ratio;
                }
                if(event.accountState.accounts.get(i).isCapitalGainsTaxable) {
                    totalTaxable += event.preTaxAmounts.get(i) * (1 - ratio);
                }
                event.taxableAmount.add(totalTaxable);
            }
            burndown.add(event);
        }

        // Recurse
        if (currentScenarioNode.optimalChild != null){
            burndownStageN(currentScenarioNode.optimalChild, burndown, startingYear);
        }
    }


    public static double calculateYearsUntilAccountsAreEmpty(ScenarioNode parent) {
        calculateYearsUntilFirstAccountDepletes(parent); // CREATE RESULTS OBJECT TO STORE RESULTS OF CURRENT PARENT NODE
        if(parent.scenario.yearsToDepletion != Double.MAX_VALUE){
            calculateEndingAccountState(parent); // CALCULATE ENDING STATE OF ACCOUNTS AFTER FIRST ACCOUNT DEPLETES
        }
        return parent.scenario.yearsToDepletion;
    }

    private static void calculateYearsUntilFirstAccountDepletes(ScenarioNode node) {
        // Calculate time to depletion of each account and find first account that depletes
        ScenarioUtility.calculateYearsUntilFirstAccountDepletes(node);

        if (node.scenario.yearsToFirstAccountDepletion == Double.MAX_VALUE) {
            //TODO code infinite money case
            node.scenario.yearsToDepletion = Double.MAX_VALUE; // You have infinite money glitch
            return;
        }

        System.out.println("=============================================");
        System.out.println("Scenario: " + node.debugScenario);
        System.out.println("Accounts: " + node.startingAccountState.accounts.stream().map(acc -> acc.principalAmount).toList());
        System.out.println("Calculation Point: " + node.scenario.calculationPoint);
        System.out.println("Post Tax Amounts for each account: " + node.scenario.postTaxAmounts);
        System.out.println("Pre Tax Amounts for each account: " + node.scenario.preTaxAmounts);
        System.out.println("Years until first account depletion: " + node.scenario.yearsToFirstAccountDepletion);
        System.out.println("Depleted account: " + node.startingAccountState.accounts.get(node.scenario.indexOfFirstAccountDepletion).accountName);
    }

    // Generate a single child node for the scenario after the first account depletes
    private static void calculateEndingAccountState(ScenarioNode parent) {
        parent.endingAccountState = new AccountState.Builder()
                .withPostTaxAmountNeededPerYear(parent.startingAccountState.postTaxAmountNeededPerYear)
                .withInterestRate(parent.startingAccountState.interestRate)
                .withIncome(parent.startingAccountState.income)
                .build();

        // For each non-depleted account, calculate the end state of that account after the first account depletes
        for (int i = 0; i < parent.getNumAccounts(); i++) {
            if (i != parent.scenario.indexOfFirstAccountDepletion && parent.startingAccountState.accounts.get(i).getTotalValue() > 0) {
                // Calculate FV of account i
                Account endingAccount = calculateEndingAccount(parent, i);
                parent.endingAccountState.accounts.add(endingAccount);
            }
        }

        System.out.println("End Principal for each remaining account: " + parent.endingAccountState.accounts.stream().map(acc -> acc.principalAmount).toList());
        System.out.println("End Capital Gains for each remaining account: " + parent.endingAccountState.accounts.stream().map(acc -> acc.capitalGainsAmount).toList());
        System.out.println("=============================================");
    }
    private static Account calculateEndingAccount(ScenarioNode parent, int i) {
        Account startingAccount = parent.startingAccountState.accounts.get(i);
        double startingAmount = startingAccount.principalAmount + startingAccount.capitalGainsAmount;
        double ratioPrincipal = startingAccount.principalAmount / startingAmount;
        double ratioCapitalGains = startingAccount.capitalGainsAmount / startingAmount;

        // TODO calculate capital gains during the period to account for ratio
        // TODO Otherwise we can get negative numbers in principal

        double preTaxAmount = parent.scenario.preTaxAmounts.get(i);

        double futureValuePrincipal= startingAccount.principalAmount;
        double futureValueCapitalGains = startingAccount.capitalGainsAmount;

        for(int year = 1; year < parent.scenario.yearsToFirstAccountDepletion; year++) {
            double totalValue = futureValuePrincipal + futureValueCapitalGains;
            double capitalGains = futureValueCapitalGains;
            double principal = futureValuePrincipal;

            futureValueCapitalGains += (principal + capitalGains) * (parent.startingAccountState.interestRate);
            totalValue = futureValuePrincipal + futureValueCapitalGains;
            futureValuePrincipal -= preTaxAmount * futureValuePrincipal / totalValue;
            futureValueCapitalGains -= preTaxAmount * futureValueCapitalGains / totalValue;
            if(futureValuePrincipal + futureValueCapitalGains == 0){
                System.out.println(futureValuePrincipal + futureValueCapitalGains);
            }
        }

        double partialYear = parent.scenario.yearsToFirstAccountDepletion - Math.floor(parent.scenario.yearsToFirstAccountDepletion);

        double totalValue = futureValuePrincipal + futureValueCapitalGains;
        double capitalGains = futureValueCapitalGains;
        double principal = futureValuePrincipal;

        futureValueCapitalGains += (principal+capitalGains)*(parent.startingAccountState.interestRate)*partialYear;
        totalValue = futureValuePrincipal + futureValueCapitalGains;
//            capitalGains = yearEndState.accounts.get(account).capitalGainsAmount;

        futureValuePrincipal -= preTaxAmount * futureValuePrincipal/totalValue * partialYear;
        futureValueCapitalGains -= preTaxAmount * futureValueCapitalGains/totalValue * partialYear;

        //set flags
        // need to computer future value of prinicpal and capital gains
        Account endingAccount = new Account(futureValuePrincipal, futureValueCapitalGains, startingAccount.accountName);
        endingAccount.isAmountTaxable = startingAccount.isAmountTaxable;
        endingAccount.isCapitalGainsTaxable = startingAccount.isCapitalGainsTaxable;
        endingAccount.capitalGainsTaxablePercentage = startingAccount.capitalGainsTaxablePercentage;
        return endingAccount;
    }
    private static boolean debugStopOnScenario(int n) {
        if (debugScenario == n) {
            "".getClass();
            return true;
        }
        return false;
    }
}


