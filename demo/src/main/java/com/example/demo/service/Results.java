package com.example.demo.service;

import java.util.ArrayList;
import java.util.List;

public class Results {

    public UserAccounts userAccounts;
    private List<String> accountNames;
    private List<Float> combination;
    List<Double> preTaxAmounts;

    Level level = new Level(null);
    private List<Double> postTaxAmounts;
    double yearsToDepletion = 0;

    double yearsToFirstAccountDepletion = Double.MAX_VALUE;

    private ArrayList<Double> optimalBracket;
    private List<UserAccounts> accounts;

    ArrayList<Results> resultsList;

    public Results(List<Float> combination, List<Double> preTaxAmounts, List<Double> postTaxAmounts, List<UserAccounts> accounts) {
        this.combination = combination;
        this.preTaxAmounts = preTaxAmounts;
        this.postTaxAmounts = postTaxAmounts;
        this.accounts = accounts;
        this.resultsList = new ArrayList<>();
    }
}
