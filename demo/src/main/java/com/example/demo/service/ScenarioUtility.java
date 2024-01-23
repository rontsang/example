package com.example.demo.service;

import com.example.demo.FinanceUtility;
import com.example.demo.model.Account;

import java.util.ArrayList;
import java.util.List;

public class ScenarioUtility {

    static void printOptimalStrategy(ScenarioNode root){
        System.out.println("Optimal Strategy:");
        ScenarioNode optimalChild = root.optimalChild;
        System.out.println("Years to Depletion: " + optimalChild.yearsToDepletion);
        int stage = 1;

        while(optimalChild != null){
            System.out.println("====================================");
            System.out.println("STAGE " + stage++ + " STRATEGY");
            System.out.println("Optimal Window: " + optimalChild.scenario.calculationPoint);
            System.out.println("Post Tax: " + optimalChild.scenario.postTaxAmounts);
            System.out.println("Pre Tax: " + optimalChild.scenario.preTaxAmounts);
            System.out.println("Years to Depletion: " + optimalChild.scenario.yearsToFirstAccountDepletion);
            optimalChild = optimalChild.optimalChild;
        }
        System.out.println("====================================");
    }

    static void calculateYearsUntilFirstAccountDepletes(ScenarioNode parent) {
        double minYearsToDepletion = Double.MAX_VALUE;

        for (int i = 0; i < parent.startingAccountState.accounts.size(); i++) {

            double yearsUntilAccountDepletes = getYearsUntilDepletion(parent.startingAccountState.accounts.get(i), parent.scenario.preTaxAmounts.get(i), parent.startingAccountState.interestRate);

            if(yearsUntilAccountDepletes < minYearsToDepletion){
                minYearsToDepletion = yearsUntilAccountDepletes;
                parent.scenario.yearsToFirstAccountDepletion = yearsUntilAccountDepletes;
                parent.scenario.indexOfFirstAccountDepletion = i;
            }
        }
    }

    static double getYearsUntilDepletion(Account account, Double annualWithdrawal, Double interestRate) {
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
}
