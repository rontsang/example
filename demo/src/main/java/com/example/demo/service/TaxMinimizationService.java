package com.example.demo.service;

import com.example.demo.FinanceUtility;
import com.example.demo.model.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

import static com.example.demo.service.ScenarioUtility.generatePermutations;
import static com.example.demo.service.ScenarioUtility.printOptimalStrategy;

// TODO Optimize infinite money case
// TODO recalculate taxes ever withdrawal based on capital gain differences
// TODO compute combined taxes for Country and Province
// TODO Volatility factors
//      TODO add inflation
//      TODO Return rate

@Service
public class TaxMinimizationService {
    static int debugScenario;
    static int intervalSize = 2;
    static int iterationsPerScenario = 4;

    public static ScenarioNode main(AccountState startingState) {
        debugScenario = 0;

        ScenarioNode root = new ScenarioNode.Builder()
            .setStartingAccountState(startingState)
            .setEndingAccountState(startingState)
            .setAccounts(startingState.getAccountsList()) //TODO delete
            .setLevel(1)
            .setScenario(new Scenario())
            .build();
        generateChildrenAndCalculate(root);



//        printOptimalStrategy(root);
            ArrayList<BurndownTimeEvent> burndown = new ArrayList<>();
            root.getOptimalChildAndYearsToDepletion();
        if(root.optimalChild.scenario.yearsToDepletion < 100 && root.scenario.yearsToDepletion < 100) {
            burndownStageN(root.optimalChild, burndown);
            root.getOptimalChildAndYearsToDepletion();
            root.displayResults();

            root.saveToFile(root, "root.ser");
            root.saveToFile(burndown, "C:\\example\\demo\\burndown.ser");

//        ScenarioNode readNode = (ScenarioNode) root.readToFile("root.ser");
//        ArrayList<BurndownTimeEvent> burndownRead = root.readToFileAl("C:\\tax\\demo\\burndown.ser");

            System.out.println(root);

            return root;
        }
        return null;
    }

    private static void burndownStageN(ScenarioNode currentScenarioNode, ArrayList<BurndownTimeEvent> burndown) {

        ArrayList<BurndownTimeEvent> nextBurnDown = Postprocessor.generateBurndownUntilFirstAccountDepletes(currentScenarioNode.startingAccountState, (ArrayList<Double>) currentScenarioNode.scenario.preTaxAmounts, burndown);

        // Print accounts in burn down
        for (BurndownTimeEvent event : nextBurnDown) {
            System.out.println("Year: " + event.year);
            System.out.println("Accounts Principle: " + event.accountState.accounts.stream().map(acc -> acc.principalAmount).toList());
            System.out.println("Accounts Capital Gains: " + event.accountState.accounts.stream().map(acc -> acc.capitalGainsAmount).toList());
        }

        // Append nextBurnDown to previousBurnDown
        for(BurndownTimeEvent event : nextBurnDown){
            burndown.add(event);
        }

        // Recurse
        if (currentScenarioNode.optimalChild != null){
            burndownStageN(currentScenarioNode.optimalChild, burndown);
        }
    }


    private static void generateChildrenAndCalculate(ScenarioNode parent) {
        generateChildren(parent);
        calculateChildren(parent);

        while(parent.children.size() > 1
                && parent.optimalNodes.size() <  iterationsPerScenario
                && parent.scenario.yearsToDepletion != Double.MAX_VALUE
        ){
            setupNextOptimizationNode(parent);
            generateChildren(parent.getCurrentOptimizationNode());
            calculateChildren(parent.getCurrentOptimizationNode());
        }
    }

    private static void setupNextOptimizationNode(ScenarioNode nodeToOptimize) {
        nodeToOptimize.getOptimalChildAndYearsToDepletion();
        setNextOptimalNode(nodeToOptimize);
        shrinkOptimizationWindow(nodeToOptimize);
    }

    private static void setNextOptimalNode(ScenarioNode nodeToOptimize) {
        ScenarioNode nextOptimizationIteration = nodeToOptimize.cloneNodeWithoutChildren();
        nodeToOptimize.optimalNodes.add(nextOptimizationIteration);
        nodeToOptimize.getCurrentOptimizationNode().optimizationWindows = new ArrayList<>();
        nextOptimizationIteration.startingAccountState = nodeToOptimize.startingAccountState;
        nextOptimizationIteration.endingAccountState = nodeToOptimize.endingAccountState;
    }

    private static void shrinkOptimizationWindow(ScenarioNode nodeToOptimize) {
        ArrayList<Double> prevOptimalPoint = nodeToOptimize.optimalChild.scenario.calculationPoint;
        int iteration = nodeToOptimize.optimalNodes.size();

        for (int j = 0; j < nodeToOptimize.optimalChild.getNumAccounts(); j++) {
            Double prevAccountOptimalPoint = prevOptimalPoint.get(j);
            System.out.println("Previous optimal point for account: " + j + " is: " + prevAccountOptimalPoint);
            Double intervalShift = 1 / (intervalSize * Math.pow(2, iteration));
            Double lowerBound = prevAccountOptimalPoint == 0 ? 0 : prevAccountOptimalPoint - intervalShift;
            Double upperBound = prevAccountOptimalPoint == 1 ? 1 : prevAccountOptimalPoint + intervalShift;

            if(prevAccountOptimalPoint == 0) upperBound += intervalShift; //shift edge case by extra interval
            if(prevAccountOptimalPoint == 1) lowerBound -= intervalShift; // shift edge case by extra interval

            nodeToOptimize.getCurrentOptimizationNode().optimizationWindows.add(new OptimizationWindow(lowerBound, upperBound));
            System.out.println("New lower bound for account: " + " is: " + lowerBound);
            System.out.println("New upper bound for account: " + " is: " + upperBound);
        }
    }

    private static void generateChildren(ScenarioNode parent) {
        debugStopOnScenario(745);

        int numAccounts = parent.endingAccountState.accounts.size();
        if(numAccounts == 0){
            return;
        }

        // Generate the scenarios to calculate (how much percent to withdraw from each account)
        List<List<Float>> scenarioPermutations = generatePermutations(numAccounts, intervalSize);

        // Loop through each scenario, adjust optimization window bounds, and create a child node
        for (List<Float> scenario : scenarioPermutations) {
            System.out.println("Scenario: " + debugScenario++);
            debugStopOnScenario(745);
            ScenarioNode child = new ScenarioNode.Builder()
                    .setStartingAccountState(parent.endingAccountState)
                    .setEndingAccountState(new AccountState())
                    .setOptimizationWindows(parent.getOptimizationWindows())
                    .setLevel(parent.level + 1)
                    .setScenario(new Scenario())
                    .setDebugScenario(debugScenario)
                    .build();

            TaxCalculationService.calculatePostTaxAmounts(child, scenario);
            TaxCalculationService.calculatePreTaxAmounts(child);

            parent.addChild(child);
        }
    }

    private static void calculateChildren(ScenarioNode parent) {
        if(debugStopOnScenario(1260)){
            "".getClass();
        }
        if(parent != null){
            for (int i = 0; i < parent.children.size(); i++) {
                ScenarioNode child = parent.getChild(i);
                calculateYearsUntilAccountsAreEmpty(child);
                if(child.scenario.yearsToDepletion == Double.MAX_VALUE){
                    if(parent.scenario == null){
                        parent.scenario = new Scenario();
                    }
                    parent.scenario.yearsToDepletion = Double.MAX_VALUE;
                    return;
                }
            }
        }
    }

    public static double calculateYearsUntilAccountsAreEmpty(ScenarioNode parent) {
        calculateYearsUntilFirstAccountDepletes(parent); // CREATE RESULTS OBJECT TO STORE RESULTS OF CURRENT PARENT NODE
        if(parent.scenario.yearsToDepletion != Double.MAX_VALUE){
            calculateEndingAccountState(parent); // CALCULATE ENDING STATE OF ACCOUNTS AFTER FIRST ACCOUNT DEPLETES
            generateChildrenAndCalculate(parent); // GENERATE CHILD NODE TO CALCULATE FOR REMAINING ACCOUNTS
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
        double years = parent.scenario.yearsToFirstAccountDepletion;
        double futureValue = FinanceUtility.calcFinalValue(startingAmount, parent.startingAccountState.interestRate, years, preTaxAmount);

        double totalTakenFromPrincipal = preTaxAmount * ratioPrincipal * years;
//        double futureValuePrincipal = startingAccount.principalAmount - totalTakenFromPrincipal;
//        double futureValueCapitalGains;

//        if (futureValue > startingAmount) {
//            // Account has grown
//            double growth = futureValue - startingAmount;
//            futureValueCapitalGains = startingAccount.capitalGainsAmount + growth + totalTakenFromPrincipal;
//        } else {
//            // Account has shrunk
//            futureValueCapitalGains = startingAccount.capitalGainsAmount - (preTaxAmount * ratioCapitalGains * years);
//            if (futureValuePrincipal < 0) {
//                // Account has been depleted
//                // Take money from capital gains
//                futureValueCapitalGains -= futureValuePrincipal;
//                futureValuePrincipal = 0;
//            }
//        }
        double futureValuePrincipal= startingAccount.principalAmount;
        double futureValueCapitalGains = startingAccount.capitalGainsAmount;

        for(int year = 1; year < parent.scenario.yearsToFirstAccountDepletion; year++) {
            double totalValue = futureValuePrincipal + futureValueCapitalGains;
            double capitalGains = futureValueCapitalGains;
            double principal = futureValuePrincipal;

            futureValueCapitalGains += (principal + capitalGains) * (parent.startingAccountState.interestRate);
//                capitalGains = yearEndState.accounts.get(account).capitalGainsAmount;
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


