package com.example.demo.service;

import java.util.ArrayList;
import java.util.List;

public class Scenario {

    // Inputs
    ArrayList<Double> calculationPoint = new ArrayList<>();

    // Intermediate Calculations
    List<Double> preTaxAmounts = new ArrayList<>();
    List<Double> postTaxAmounts = new ArrayList<>();
    List<Double> taxableAmounts = new ArrayList<>();

    List<Integer> debugChain;

    int debugScenario = 0;

    // Outputs
//    ScenarioNode resultsSummary = new ScenarioNode();
    public double yearsToDepletion = 0;
    double yearsToFirstAccountDepletion = Double.MAX_VALUE;

    int indexOfFirstAccountDepletion;
}
