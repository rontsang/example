package com.example.demo.service;

import java.util.ArrayList;
import java.util.List;

public class Results {

    // Inputs
    ArrayList<Double> calculationPoint = new ArrayList<>();

    // Intermediate Calculations
    List<Double> preTaxAmounts;
    List<Double> postTaxAmounts;

    // Outputs
    ResultsSummary resultsSummary = new ResultsSummary();
    double yearsToDepletion = 0;
    double yearsToFirstAccountDepletion = Double.MAX_VALUE;
}
