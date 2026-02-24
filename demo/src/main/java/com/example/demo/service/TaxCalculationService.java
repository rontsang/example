package com.example.demo.service;

import com.example.demo.model.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class TaxCalculationService {
    private static List<TaxBracket> taxBrackets;
    private static List<FederalTaxBracket> taxBracketsFederal;
    private final TaxBracketStore taxBracketStore;


    @Autowired
    public TaxCalculationService(TaxBracketStore taxBracketStore) {
        this.taxBracketStore = taxBracketStore;
    }

    @PostConstruct
    private void loadTaxBrackets() {
        taxBrackets = taxBracketStore.getTaxBrackets();
        taxBracketsFederal = taxBrackets.stream()
                .map(bracket -> {
                    FederalTaxBracket federal = new FederalTaxBracket();
                    federal.setIndex(bracket.getIndex());
                    federal.setLower_bound(bracket.getLower_bound());
                    federal.setUpper_bound(bracket.getUpper_bound());
                    federal.setRate(bracket.getRate());
                    return federal;
                })
                .toList();
    }

//    public static double calculateWithdrawalAmounts(double postTaxTotal) {
//        // Sum up how much is needed pre-tax
//        double preTaxTotal = calculatePreTaxAmount(postTaxTotal);
//
//        // Divide the amounts taken from each account proportionally
//        double taxDeferredPreTax = preTaxTotal * (taxDeferredPostTax/preTaxTotal);
//        double taxablePreTax = preTaxTotal * (taxablePostTax/preTaxTotal);
//
//        return new preTaxTotal;
//    }

    // Computes how much pre-tax money to withdraw from account to satisfy afterTaxAmount
    public static double calculatePreTaxAmount(double afterTaxAmount, double income) {
        int currentTaxBracket = 0;
        double preTaxAmount = 0;

        double afterTaxAmountStillNeeded = afterTaxAmount;

        // Cycle through all tax indexes
        while(currentTaxBracket < taxBrackets.size() && afterTaxAmountStillNeeded > 0) {
            // Get current tax bracket
            AbstractTaxBracket bracket = taxBrackets.get(currentTaxBracket);

            double lowerBound = bracket.getLower_bound();

            // Shift brackets based on income
            if(bracket.getUpper_bound() != null && bracket.getUpper_bound() <= income){
                afterTaxAmountStillNeeded = (bracket.getUpper_bound() - lowerBound) * (1-bracket.getRate());
                income -= bracket.getUpper_bound();
                currentTaxBracket++;
                continue;
            } else if((bracket.getUpper_bound() == null || income < bracket.getUpper_bound()) && income > bracket.getLower_bound()){
                if(income > lowerBound) {
                    afterTaxAmountStillNeeded = (income - lowerBound) * (1-bracket.getRate());
                    lowerBound -= income;
                }
            }

            // Calculate how much money we can get from current bracket
            double preTaxAmountFromBracket;
            double afterTaxAmountFromBracket;

            if(bracket.getUpper_bound() != null){
                preTaxAmountFromBracket = (bracket.getUpper_bound() - lowerBound);
                afterTaxAmountFromBracket = (bracket.getUpper_bound() - lowerBound) * (1-bracket.getRate());
            } else {
                preTaxAmountFromBracket = afterTaxAmountStillNeeded/(1-bracket.getRate());
                afterTaxAmountFromBracket = afterTaxAmountStillNeeded;
            }

            // If amount needed is less than afterTaxAmount
            if(afterTaxAmountFromBracket < afterTaxAmountStillNeeded) {
                preTaxAmount += preTaxAmountFromBracket;
                afterTaxAmountStillNeeded -= afterTaxAmountFromBracket;
                currentTaxBracket++;
            } else {
                preTaxAmount += afterTaxAmountStillNeeded/(1-bracket.getRate());
                afterTaxAmountStillNeeded = 0;
            }
        }
        return preTaxAmount;
    }

    public static double calculatePostTaxAmount(double amount) {
        double provincialBasicAmount = 11865;
        double federalBasicAmount = 15000;

        double provincialIncome = incomeAfterTaxCredit(amount, provincialBasicAmount);
        double federalIncome = incomeAfterTaxCredit(amount, federalBasicAmount);

        double postTaxProvincial = calculatePostTaxAmount(provincialIncome, "ON");
        double postTaxFederal = calculatePostTaxAmount(federalIncome, "Canada");

        double taxProvincial = provincialIncome - postTaxProvincial;
        double taxFederal = federalIncome - postTaxFederal;

        return amount - taxProvincial - taxFederal;
    }

    private static double incomeAfterTaxCredit(double amount, double taxCredit) {
        if(amount - taxCredit < 0){
            return 0;
        } else {
           return amount - taxCredit;
        }
    }

    public static double calculatePostTaxAmount(double amount, String location){
        List<? extends AbstractTaxBracket> taxBracketList = location.equals("Canada") ? taxBracketsFederal : taxBrackets;

        double preTaxAmount = amount;
        double postTaxAmount = amount;
        int currentTaxBracket = 0;
        // Cycle through all tax indexes
        while(currentTaxBracket < taxBracketList.size()) {
            // Get current tax bracket
            AbstractTaxBracket bracket = taxBracketList.get(currentTaxBracket);
            if(bracket.getLower_bound() > preTaxAmount){
                break;
            }
            double afterTaxAmountFromBracket;

            // Calculate how much money we can get from current bracket
            if(bracket.getUpper_bound() != null){
                if(bracket.getUpper_bound() < preTaxAmount){
                    postTaxAmount -= (bracket.getUpper_bound() - bracket.getLower_bound()) * bracket.getRate();
                } else {
                    postTaxAmount -= (preTaxAmount - bracket.getLower_bound()) * bracket.getRate();
                }
            } else {
                postTaxAmount -= (preTaxAmount - bracket.getLower_bound()) * bracket.getRate();
            }
            currentTaxBracket++;
        }
        return postTaxAmount;
    }

    static double calculatePreTaxAmount(ScenarioNode node, List<Float> scenario) {
        // Initial conditions
        double income = node.startingAccountState.income;
        double totalWithdrawal = node.startingAccountState.postTaxAmountNeededPerYear;
        Account accountRRSP = null;
        Account accountTFSA = null;
        Account accountMARG = null;
        double targetRRSPpercentage = 0;
        double targetTFSApercentage= 0;
        double targetMARGpercentage= 0;

        for (int i = 0; i < node.getNumAccounts(); i++) {
            Account account = node.startingAccountState.accounts.get(i);
            double percentage = node.scenario.calculationPoint.get(i);
            switch (account.accountName) {
                case "RRSP":
                    targetRRSPpercentage = percentage;
                    accountRRSP = account;
                    break;
                case "TFSA":
                    targetTFSApercentage = percentage;
                    accountTFSA = account;
                    break;
                case "MARG":
                    targetMARGpercentage = percentage;
                    accountMARG = account;
                    break;
            }
        }

        double totalNonTaxable = targetRRSPpercentage + targetMARGpercentage;

        double ratioCG2P = 0;
        double ratioCG   = 0;

        if(accountMARG == null){
            targetMARGpercentage = 0;
        } else{
            ratioCG2P = accountMARG.capitalGainsAmount / (accountMARG.capitalGainsAmount + accountMARG.principalAmount);
            ratioCG   = accountMARG.capitalGainsTaxablePercentage;

        }

        // Total target is withdrawal needed minus non-taxable amounts
        double postTaxTarget = totalWithdrawal; // target - non-taxable amounts

        // Initial pre-tax guess
        double preTaxGuessRRSP = (postTaxTarget - income) * targetRRSPpercentage;
        double preTaxGuessMARG = (postTaxTarget - income) * targetMARGpercentage;
        double preTaxGuessTFSA = (postTaxTarget - income) * targetTFSApercentage;
        double preTaxIncome = income;
        double tolerance = 50; // final value needs to be within 50 dollars correct

        double differenceTotal = Double.MAX_VALUE;

        System.out.println("Starting guessing process...");
        int iterations = 0;
        if(totalNonTaxable != 0) {
            while (Math.abs(differenceTotal) > tolerance){

                System.out.println("Iteration: " + iterations++);
                if(iterations > 50) break;
                // Overall plan
                // Guess what the pre-tax amounts are
                // Calculate the post-tax amounts based on guess (and see if we are close)
                // Take total pre-tax amounts and add the difference from above step
                    // Distribute this pre-tax amount to each account based on the percentages

                // Step 1. Calculate taxable income
                double taxableRRSP = preTaxGuessRRSP;
                double taxableMargin = preTaxGuessMARG * ratioCG2P * ratioCG;
                double preTaxTotal = income + taxableRRSP + taxableMargin;

                double postTaxTotal = calculatePostTaxAmount(preTaxTotal); // How much we need from all taxable accounts and income
                System.out.println("taxableRRSP: " + taxableRRSP);
                System.out.println("taxableMargin: " + taxableMargin);
                System.out.println("Pre tax total: " + preTaxTotal);
                System.out.println("Post tax total: " + postTaxTotal);

                // Step 2. Calculate post tax amounts from each account
                double effectiveRate = 1 - postTaxTotal / preTaxTotal;

                double effectiveIncome = income * (1 - effectiveRate);

                double effectiveRRSP = preTaxGuessRRSP * (1 - effectiveRate);

                double effectiveMarginP = preTaxGuessMARG * (1 - ratioCG2P); // Principal
                double effectiveMarginCGNonTaxable = preTaxGuessMARG * ratioCG2P * ratioCG; // Non-taxable capital gains
                double effectiveMarginCGTaxable = preTaxGuessMARG * ratioCG2P * (ratioCG * (1 - effectiveRate));

                double effectiveMARG = effectiveMarginP + effectiveMarginCGNonTaxable + effectiveMarginCGTaxable; // Total

                double effectiveTFSA = 0;
                if(targetTFSApercentage != 0){
//                    effectiveTFSA = totalWithdrawal - effectiveRRSP - effectiveMARG - effectiveIncome;
                      effectiveTFSA = preTaxGuessTFSA;
                }

                // Step 3. Calculate post tax amounts from each account and income
                differenceTotal = postTaxTarget - effectiveIncome - effectiveRRSP - effectiveMARG - effectiveTFSA;

                // Update guesses for next iteration
                double newGuessTotal = preTaxGuessRRSP + preTaxGuessMARG + preTaxGuessTFSA + differenceTotal;
                preTaxGuessRRSP = newGuessTotal * targetRRSPpercentage;
                preTaxGuessMARG = newGuessTotal * targetMARGpercentage;
                preTaxGuessTFSA = newGuessTotal * targetTFSApercentage;
            }
        } else {
            double postTaxTotal = calculatePostTaxAmount(income);
            preTaxGuessTFSA = totalWithdrawal - postTaxTotal;
        }

        savePretaxAmountsToScenarioNode(node, preTaxGuessRRSP, preTaxGuessMARG, preTaxGuessTFSA);

        System.out.println("Pre tax guessing complete: " + node.scenario.calculationPoint);
        System.out.println("Scenario: " + node.scenario.calculationPoint);
        System.out.println("Pre Tax Amounts for each account: " + node.scenario.preTaxAmounts);

        return 0;
    }

    private static void savePretaxAmountsToScenarioNode(ScenarioNode node, double preTaxGuessRRSP, double preTaxGuessMARG, double preTaxGuessTFSA) {
        for (int i = 0; i < node.getNumAccounts(); i++) {
            Account account = node.startingAccountState.accounts.get(i);
            double percentage = node.scenario.calculationPoint.get(i);
            switch (account.accountName) {
                case "RRSP":
                    node.scenario.preTaxAmounts.add(preTaxGuessRRSP);
                    break;
                case "TFSA":
                    node.scenario.preTaxAmounts.add(preTaxGuessTFSA);
                    break;
                case "MARG":
                    node.scenario.preTaxAmounts.add(preTaxGuessMARG);
                    break;
            }
        }
    }


    private static double getAfterTaxTotalTaxable(ScenarioNode node, ArrayList<Double> taxableAmounts) {
        double afterTaxTotalTaxable = 0;
        for (int i = 0; i < node.startingAccountState.accounts.size(); i++) {
            Account account = node.startingAccountState.accounts.get(i);
            double taxableAmount = 0.0;
            double accountTotal = account.principalAmount + account.capitalGainsAmount;
            double amountFromPrincipal = node.scenario.postTaxAmounts.get(i) * (account.principalAmount / accountTotal);
            double amountFromCapitalGains = node.scenario.postTaxAmounts.get(i) * (account.capitalGainsAmount / accountTotal);

            if (account.isAmountTaxable) {
                taxableAmount += amountFromPrincipal;
            }
            if (account.isCapitalGainsTaxable) {
                taxableAmount += amountFromCapitalGains * account.capitalGainsTaxablePercentage;
            }
            node.scenario.taxableAmounts.add(taxableAmount);
            taxableAmounts.add(taxableAmount); //TODO delete and just add to afterTaxTotalTaxable
            afterTaxTotalTaxable += taxableAmount;
        }
        return afterTaxTotalTaxable;
    }
    static void calculatePostTaxAmounts(ScenarioNode parent, List<Float> scenario) {
        ArrayList<OptimizationWindow> optimizationWindows = parent.getOptimizationWindows();

        ArrayList<Double> postTaxAmounts = new ArrayList<>(parent.startingAccountState.accounts.size());

        List<Float> adjustedCalculation = new ArrayList<>(Collections.nCopies(parent.startingAccountState.accounts.size(), (float) 0.0));

        // Step 1 part B
        // Calculate the adjusted percentages for each account + bracket
        for (int accountNumber = 0; accountNumber < parent.startingAccountState.accounts.size(); accountNumber++) {
            double lowerBound = optimizationWindows.get(accountNumber).lowerBound;
            double upperBound = optimizationWindows.get(accountNumber).upperBound;
            double range = upperBound - lowerBound;
            double adjustedPercentage = 0;

//            double incomePostTax = TaxCalculationService.calculatePostTaxAmount(parent.startingAccountState.income);
            double withdrawalAmount = parent.startingAccountState.postTaxAmountNeededPerYear;
//            withdrawalAmount -= incomePostTax;

            if (accountNumber == scenario.size() - 1) {
                adjustedPercentage = 1 - adjustedCalculation.stream().mapToDouble(Float::doubleValue).sum();
                adjustedCalculation.set(accountNumber, (float) adjustedPercentage);
            } else {
                adjustedPercentage = lowerBound + (scenario.get(accountNumber) * range);
                adjustedCalculation.set(accountNumber, (float) adjustedPercentage);
            }

            scenario.set(accountNumber, (float) adjustedPercentage);
//            parent.scenario.postTaxAmounts.add(withdrawalAmount * adjustedPercentage);
            parent.scenario.calculationPoint.add(adjustedPercentage);

            // Used calculated percentages to calculate how much to withdraw from each account
//            postTaxAmounts.add(parent.scenario.postTaxAmounts.get(accountNumber) * adjustedPercentage);
        }
        if(parent.scenario.calculationPoint == null){
            System.out.println("test");
        }
        System.out.println(parent.scenario.calculationPoint);
        System.out.println("Post Tax Amounts for each account: " + postTaxAmounts);
    }

    // TODO calculate pre-tax amount based on changing capital gains amount
    // Loop this calculate for each year, recalculate step 1, 2 and 3 and save to a data structure until empty
    // Add the loop in years until first account depletes
    static void calculatePreTaxAmounts(ScenarioNode node) {
//        double years = 0;
        ArrayList<Double> taxableAmounts = new ArrayList<>();

        // Step 1. Calculate taxable amounts for each account
        // We know how much we want to simulate withdrawing from each account in this node
        // We need to calculate how much of that amount is taxable
        double afterTaxTotalTaxable = getAfterTaxTotalTaxable(node, taxableAmounts);

        // Step 2. Calculate pre-tax withdrawal amounts per account based on afterTaxTotalTaxable
        // We have the total taxable dollars to withdraw and after income tax
        // We need to calculate how much we need to withdraw from each account to get that amount
        double preTaxTotal = TaxCalculationService.calculatePreTaxAmount(afterTaxTotalTaxable, node.startingAccountState.income);

        // Step 3 Calculate total withdrawal amounts. Withdrawal amounts = (1) + (2)
        // 1. PostTaxAmount
        // 2. Distribute the taxes proportionally to all accounts
        ArrayList<Double> withdrawalAmounts = new ArrayList<>();
        for (int i = 0; i < node.startingAccountState.accounts.size(); i++) {
            Double withdrawalAmount = node.scenario.postTaxAmounts.get(i);

            // If there are taxes to add
            if (afterTaxTotalTaxable > 0) {
                withdrawalAmount += (taxableAmounts.get(i) / afterTaxTotalTaxable) * (preTaxTotal - afterTaxTotalTaxable);
            }
            withdrawalAmounts.add(withdrawalAmount);
        }
        System.out.println("Pre Tax Amounts for each account: " + withdrawalAmounts);
        System.out.println("Starting Principal for each account: " + node.startingAccountState.accounts.stream().map(acc -> acc.principalAmount).toList());
        System.out.println("Starting Capital Gains for each account: " + node.startingAccountState.accounts.stream().map(acc -> acc.capitalGainsAmount).toList());

        node.scenario.preTaxAmounts = withdrawalAmounts;
    }

}
