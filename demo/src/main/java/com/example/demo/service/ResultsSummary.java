package com.example.demo.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class ResultsSummary {

    public UserAccounts userAccounts;

    double yearsToDepletion = Double.MAX_VALUE;

    List<String> accounts;

    ArrayList<Results> resultsList;

    public ResultsSummary() {
        this.resultsList = new ArrayList<>();
    }

    private static void findMaximumYearsToDepletionFromResults(ResultsSummary resultsSummary) {
        resultsSummary.yearsToDepletion = resultsSummary.resultsList.stream().mapToDouble(v -> v.yearsToDepletion).max().getAsDouble();
        int optimalBracketIndex = getMaxValueIndex(resultsSummary.resultsList.stream().map(res -> res.yearsToDepletion).collect(Collectors.toCollection(ArrayList::new)));
        resultsSummary.resultsList.get(optimalBracketIndex).calculationPoint = resultsSummary.resultsList.get(optimalBracketIndex).calculationPoint;
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
}
