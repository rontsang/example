package com.example.demo.service;

import com.example.demo.model.TaxBracket;
import com.example.demo.model.WithdrawalAmounts;
import com.example.demo.repository.TaxBracketRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

public class TaxCalculationService {
    private List<TaxBracket> taxBrackets;

    @Autowired
    private TaxBracketRepository taxBracketRepository;
    @PostConstruct
    private void loadTaxBrackets() {
        taxBrackets = taxBracketRepository.findAll();
    }

    public static WithdrawalAmounts calculateWithdrawalAmounts(double taxDeferredPostTax, double taxablePostTax) {
        // Sum up how much is needed pre-tax
        double preTaxTotal = calculatePreTaxAmount(taxDeferredPostTax + taxablePostTax);

        // Divide the amounts taken from each account proportionally
        double taxDeferredPreTax = preTaxTotal * (taxDeferredPostTax/preTaxTotal);
        double taxablePreTax = preTaxTotal * (taxablePostTax/preTaxTotal);

        return new WithdrawalAmounts(taxDeferredPreTax, taxablePreTax);
    }

    // Computes how much pre-tax money to withdraw from account to satisfy afterTaxAmount
    public double calculatePreTaxAmount(double afterTaxAmount) {
        int currentTaxBracket = 0;
        double preTaxAmount = 0;
        double afterTaxAmountStillNeeded = afterTaxAmount;

        taxBrackets = taxBracketRepository.findAll();

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

}
