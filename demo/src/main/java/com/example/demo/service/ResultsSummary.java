package com.example.demo.service;

import com.example.demo.model.User;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class ResultsSummary {
    // INPUTS
    public User user;
    List<String> accounts;

    // OUTPUTS
    ArrayList<Results> resultsList;
    double yearsToDepletion = Double.MAX_VALUE;
    List<Double> optimalWindow;
    int optimalIndex;

    public ResultsSummary() {
        this.resultsList = new ArrayList<>();
    }
    void findMaximumYearsToDepletionFromResults() {
        this.yearsToDepletion = this.resultsList.stream().mapToDouble(v -> v.yearsToDepletion).max().getAsDouble();
        int optimalBracketIndex = getMaxValueIndex();
        this.optimalWindow = this.resultsList.get(optimalBracketIndex).calculationPoint;
        this.optimalIndex = optimalBracketIndex;
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
}
