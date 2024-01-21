package com.example.demo.service;

import com.example.demo.model.Account;
import com.example.demo.model.OptimizationWindow;
import com.example.demo.model.TaxBracket;
import com.example.demo.repository.TaxBracketRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class TaxCalculationService {
    private static List<TaxBracket> taxBrackets;

    private static TaxBracketRepository taxBracketRepository;

    @Autowired
    public TaxCalculationService(TaxBracketRepository taxBracketRepository) {
        this.taxBracketRepository = taxBracketRepository;
    }

    @PostConstruct
    private void loadTaxBrackets() {
        taxBrackets = taxBracketRepository.findAll();
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
    public static double calculatePreTaxAmount(double afterTaxAmount) {
        int currentTaxBracket = 0;
        double preTaxAmount = 0;
        double afterTaxAmountStillNeeded = afterTaxAmount;

        // Cycle through all tax indexes
        while(currentTaxBracket < taxBrackets.size() && afterTaxAmountStillNeeded > 0) {
            // Get current tax bracket
            TaxBracket bracket = taxBrackets.get(currentTaxBracket);

            // Calculate how much money we can get from current bracket
            double preTaxAmountFromBracket;
            double afterTaxAmountFromBracket;

            if(bracket.getUpper_bound() != null){
                preTaxAmountFromBracket = (bracket.getUpper_bound() - bracket.getLower_bound());
                afterTaxAmountFromBracket = (bracket.getUpper_bound() - bracket.getLower_bound()) * (1-bracket.getRate());
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


            if (accountNumber == scenario.size() - 1) {
                adjustedPercentage = 1 - adjustedCalculation.stream().mapToDouble(Float::doubleValue).sum();
                adjustedCalculation.set(accountNumber, (float) adjustedPercentage);
            } else {
                adjustedPercentage = lowerBound + (scenario.get(accountNumber) * range);
                adjustedCalculation.set(accountNumber, (float) adjustedPercentage);
            }

            scenario.set(accountNumber, (float) adjustedPercentage);
            parent.scenario.postTaxAmounts.add(parent.startingAccountState.postTaxAmountNeededPerYear * adjustedPercentage);
            parent.scenario.calculationPoint.add(adjustedPercentage);

            // Used calculated percentages to calculate how much to withdraw from each account
            postTaxAmounts.add(parent.scenario.postTaxAmounts.get(accountNumber) * adjustedPercentage);
        }
        System.out.println(parent.scenario.calculationPoint);
        System.out.println("Post Tax Amounts for each account: " + postTaxAmounts);
    }
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
        double preTaxTotal = TaxCalculationService.calculatePreTaxAmount(afterTaxTotalTaxable);

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
