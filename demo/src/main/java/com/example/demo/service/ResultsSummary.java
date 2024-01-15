package com.example.demo.service;

import com.example.demo.model.User;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class ResultsSummary {
    // INPUTS
    public User user;
    List<String> accounts;
    Integer level = 0;

    List<Integer> debugChain = new ArrayList<>();

    // OUTPUTS
    ArrayList<Results> resultsList;
    double yearsToDepletion = Double.MAX_VALUE;
    List<Double> optimalWindow;
    int optimalIndex;

    int debugScenario = 0;

    public ResultsSummary() {
        this.resultsList = new ArrayList<>();
    }
    void findMaximumYearsToDepletionFromResults() {
        this.yearsToDepletion = this.resultsList.stream().mapToDouble(v -> v.yearsToDepletion).max().getAsDouble();
        int optimalBracketIndex = getMaxValueIndex();
        this.optimalWindow = this.resultsList.get(optimalBracketIndex).calculationPoint;
        this.optimalIndex = optimalBracketIndex;
        this.debugScenario = this.resultsList.get(optimalBracketIndex).debugScenario;
    }
    int getMaxValueIndex(){
        List<Double> list = this.resultsList.stream().map(res -> res.yearsToDepletion).collect(Collectors.toCollection(ArrayList::new));
        int maxIndex = 0;
        double maxValue = list.get(0);

        for (int i = 1; i < list.size(); i++) {
            if (list.get(i) > maxValue) {
                maxValue = list.get(i);
                maxIndex = i;
            }
        }
        return maxIndex;
    }

    void saveResults(Results result, ArrayList<Double> postTaxAmounts, double year) {
        result.postTaxAmounts = postTaxAmounts;
        result.yearsToFirstAccountDepletion = year;
        result.yearsToDepletion = year + result.resultsSummary.yearsToDepletion;
        this.resultsList.add(result);
    }

    void displayResults() {
        System.out.println();
        System.out.println();
        System.out.println();
        System.out.println("====================================");
        System.out.println("Results Summary");
        System.out.println("Years to Depletion: " + this.yearsToDepletion);

        ResultsSummary printResults = this;

        Integer index;
        Integer depletedAccountIndex = 0;
        int count = 1;
        try {
            do {
                index = printResults.optimalIndex;

                System.out.println("Starting Amounts in Loop: " + count++);
                System.out.println(printResults.accounts);
                // print account totals at the start
                for (int i = 0; i < printResults.accounts.size(); i++) {
                    System.out.print("Account: " + printResults.accounts.get(i));
                    System.out.print(" has " + (int) printResults.user.accounts.get(i).getTotalValue());
                    System.out.println(" Withdraw " + (Math.round(printResults.resultsList.get(index).preTaxAmounts.get(i))));
                }

                depletedAccountIndex = printResults.resultsList.get(index).indexOfFirstAccountDepletion;
                System.out.print("Until account: " + accounts.get(depletedAccountIndex));
                System.out.println(" is depleted in " + printResults.resultsList.get(depletedAccountIndex).yearsToFirstAccountDepletion + " years");
                System.out.println("====================================");

                if (printResults.resultsList.get(index).resultsSummary != null) {
                    printResults = printResults.resultsList.get(index).resultsSummary;
                }
            } while (printResults.accounts != null);
        }
        catch (Exception e) {
            System.out.println("Error: " + e);
        }
    }
}
