package com.example.demo.service;

import com.example.demo.model.AccountState;
import com.example.demo.model.BurndownTimeEvent;

import java.util.ArrayList;

import static com.example.demo.service.ScenarioUtility.getYearsUntilDepletion;

public class Postprocessor {
    static ArrayList<BurndownTimeEvent> generateBurndownUntilFirstAccountDepletes(AccountState startingAccountState, ArrayList<Double> withdrawalsPerYear, ArrayList<BurndownTimeEvent> currentBurnDown) {
        double startingYear = 0;

        if(currentBurnDown != null && currentBurnDown.size() > 0){
            BurndownTimeEvent lastEvent = currentBurnDown.get(currentBurnDown.size()-1);
            startingYear = lastEvent.year;
        }

        ArrayList<BurndownTimeEvent> newBurndown = new ArrayList<>();
        BurndownTimeEvent startingEvent = new BurndownTimeEvent(startingAccountState, startingYear);
        newBurndown.add(startingEvent);

        double yearsToFirstAccountDepletion = calculateYearsUntilFirstAccountDepletes(startingAccountState, withdrawalsPerYear);
        calculateResultStatePerYear(startingAccountState, withdrawalsPerYear, newBurndown, yearsToFirstAccountDepletion);

        return newBurndown;
    }

    private static void calculateResultStatePerYear(AccountState startingAccountState, ArrayList<Double> withdrawalsPerYear, ArrayList<BurndownTimeEvent> burndown, double yearsToFirstAccountDepletion) {
        AccountState currentState = startingAccountState.cloneAccountState();
        // TODO Remove duplicated code from tax calculation service
        // TODO Remove duplicated code from here (partial and full cases)
        // TODO Cap gains should be at year end, not start, and should account for withdrawals.

        // If accounts are zero value, return
        // TODO this is not needed if burndowns are correct...
        if (currentState.accounts.stream().allMatch(account -> account.getTotalValue() < 0.02)) {
            return;
        }

        // Calculate partial year
        double partialYear = Math.ceil(burndown.get(0).year) - burndown.get(0).year;
        boolean willItFillToNextYear = (yearsToFirstAccountDepletion - partialYear) > 1;
        if(burndown.get(0) != null && burndown.get(0).year != 0 && willItFillToNextYear){
            AccountState yearEndState = currentState.cloneAccountState();
            for(int account = 0; account < startingAccountState.accounts.size(); account++){
                double totalValue = currentState.accounts.get(account).getTotalValue();
                double capitalGains = currentState.accounts.get(account).capitalGainsAmount;
                double principal = currentState.accounts.get(account).principalAmount;

                yearEndState.accounts.get(account).capitalGainsAmount += (principal+capitalGains)*(currentState.interestRate)*partialYear;
//                capitalGains = yearEndState.accounts.get(account).capitalGainsAmount;
                totalValue = yearEndState.accounts.get(account).capitalGainsAmount + yearEndState.accounts.get(account).principalAmount;
                capitalGains = yearEndState.accounts.get(account).capitalGainsAmount;

                yearEndState.accounts.get(account).principalAmount -= withdrawalsPerYear.get(account)*principal/totalValue*partialYear;
                yearEndState.accounts.get(account).capitalGainsAmount -= withdrawalsPerYear.get(account)*capitalGains/totalValue*partialYear;

                roundAccountToNearestCent(yearEndState, account);
            }
            burndown.add(new BurndownTimeEvent(yearEndState, Math.ceil(burndown.get(0).year)));
            currentState = yearEndState;
//            burndown.remove(0);
            yearsToFirstAccountDepletion -= partialYear;
        }

        // Calculate all whole years
        for(int year = 1; year < yearsToFirstAccountDepletion; year++){
            AccountState yearEndState = currentState.cloneAccountState();
            for(int account = 0; account < startingAccountState.accounts.size(); account++){
                double totalValue = currentState.accounts.get(account).getTotalValue();
                double capitalGains = currentState.accounts.get(account).capitalGainsAmount;
                double principal = currentState.accounts.get(account).principalAmount;

                yearEndState.accounts.get(account).capitalGainsAmount += (principal+capitalGains)*(currentState.interestRate);
//                capitalGains = yearEndState.accounts.get(account).capitalGainsAmount;
                totalValue = yearEndState.accounts.get(account).capitalGainsAmount + yearEndState.accounts.get(account).principalAmount;
                capitalGains = yearEndState.accounts.get(account).capitalGainsAmount;

                yearEndState.accounts.get(account).principalAmount -= withdrawalsPerYear.get(account)*principal/totalValue;
                yearEndState.accounts.get(account).capitalGainsAmount -= withdrawalsPerYear.get(account)*capitalGains/totalValue;
                System.out.println(yearEndState.accounts.get(0).getTotalValue());
                roundAccountToNearestCent(yearEndState, account);
            }
            burndown.add(new BurndownTimeEvent(yearEndState.cloneAccountState(), year + Math.ceil(burndown.get(0).year)));
            currentState = yearEndState;
        }

        // Calculate partial year
        partialYear = yearsToFirstAccountDepletion - Math.floor(yearsToFirstAccountDepletion);
        AccountState yearEndState = currentState.cloneAccountState();
        for(int account = 0; account < startingAccountState.accounts.size(); account++){
            double totalValue = currentState.accounts.get(account).getTotalValue();
            double capitalGains = currentState.accounts.get(account).capitalGainsAmount;
            double principal = currentState.accounts.get(account).principalAmount;

            yearEndState.accounts.get(account).capitalGainsAmount += (principal+capitalGains)*(currentState.interestRate)*partialYear;
//            capitalGains = yearEndState.accounts.get(account).capitalGainsAmount;
            totalValue = yearEndState.accounts.get(account).capitalGainsAmount + yearEndState.accounts.get(account).principalAmount;
            capitalGains = yearEndState.accounts.get(account).capitalGainsAmount;

            yearEndState.accounts.get(account).principalAmount -= withdrawalsPerYear.get(account)*principal/totalValue*partialYear;
            yearEndState.accounts.get(account).capitalGainsAmount -= withdrawalsPerYear.get(account)*capitalGains/totalValue*partialYear;

            roundAccountToNearestCent(yearEndState, account);
        }
        if(willItFillToNextYear){
            burndown.add(new BurndownTimeEvent(yearEndState, yearsToFirstAccountDepletion + Math.ceil(burndown.get(0).year)));
        } else {
            burndown.add(new BurndownTimeEvent(yearEndState, yearsToFirstAccountDepletion + burndown.get(0).year));
        }
    }

    private static void roundAccountToNearestCent(AccountState yearEndState, int account) {
        yearEndState.accounts.get(account).principalAmount = Math.round(yearEndState.accounts.get(account).principalAmount*100.0)/100.0;
        if(yearEndState.accounts.get(account).principalAmount < 0.02){
            yearEndState.accounts.get(account).principalAmount = 0;
        }
        yearEndState.accounts.get(account).capitalGainsAmount = Math.round(yearEndState.accounts.get(account).capitalGainsAmount*100.0)/100.0;
        if(yearEndState.accounts.get(account).capitalGainsAmount < 0.02){
            yearEndState.accounts.get(account).capitalGainsAmount = 0;
        }
    }


    static double calculateYearsUntilFirstAccountDepletes(AccountState startingAccountState, ArrayList<Double> withdrawalsPerYear) {
        double minYearsToDepletion = Double.MAX_VALUE;

        for (int i = 0; i < startingAccountState.accounts.size(); i++) {
            double yearsUntilAccountDepletes = getYearsUntilDepletion(startingAccountState.accounts.get(i), withdrawalsPerYear.get(i), startingAccountState.interestRate);
            if(yearsUntilAccountDepletes < minYearsToDepletion){
                minYearsToDepletion = yearsUntilAccountDepletes;
            }
        }
        return minYearsToDepletion;
    }
}
