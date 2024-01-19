package com.example.demo.service;

import com.example.demo.model.AccountState;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class ScenarioNode {
    public ArrayList<Double> pretaxAmounts;
    public ArrayList<Double> postTaxAmounts;
    public ArrayList<Double> taxableAmounts;
    public int indexOfFirstAccountDepletion;

    public ArrayList<ScenarioNode> optimizedNodes = new ArrayList<>();

    // Tree Structure
    // List contains the iterations (only the optimal one needs a list of iterations)
    // Each iteration contains a list of the children of each combination
    List<List<ScenarioNode>> children = new ArrayList<>();

    // INPUTS
    AccountState startingAccountState;
    AccountState endingAccountState = new AccountState();
    List<String> accounts;
    Integer level = 0;

    Scenario result = new Scenario(); // calculate current node, top parent node has no calculation
    // use to generate children

    public void addChild(ScenarioNode child) {
        List<ScenarioNode> childList = new ArrayList<>();
        childList.add(child);
        children.add(childList);
    }
    public void addChild(List<ScenarioNode> child) {
        children.add(child);
    }

    public ScenarioNode getChild(int index) {
        return this.children.isEmpty() ? null: this.children.get(index).get(0);
    }

    public ScenarioNode getOptimizedChild(int index) {
        if (children.get(index).size() == 1) {
            System.out.println("The was not chosen for optimization");
        } else {
            List<ScenarioNode> optimizedChildList = children.get(index);
            ScenarioNode lastChild = optimizedChildList.get(optimizedChildList.size() - 1);
            return lastChild;
        }
        return null;
    }

    public void createChildNode() {
        addChild(new ArrayList<>());
    }


    List<Integer> debugChain = new ArrayList<>();

    // OUTPUTS
    // ArrayList<Results> resultsList; // No more resultsList, only children nodes

    double yearsToDepletion = Double.MAX_VALUE;
    List<Double> optimalWindow;
    int optimalIndex;
    int debugScenario = 0;

    public ScenarioNode() {}

    void findMaximumYearsToDepletion() {
        // TODO Traverse through all children and find the optimal one

//        this.yearsToDepletion = this.resultsList.stream().mapToDouble(v -> v.yearsToDepletion).max().getAsDouble();
//        int optimalBracketIndex = getMaxValueIndex();
//        this.optimalWindow = this.resultsList.get(optimalBracketIndex).calculationPoint;
//        this.optimalIndex = optimalBracketIndex;
//        this.debugScenario = this.resultsList.get(optimalBracketIndex).debugScenario;
    }
    int getMaxValueIndex(){
        // TODO Traverse through all children and find the optimal one
        return 0; // return max index
    }

//    void saveResults(Results result, ArrayList<Double> postTaxAmounts, double year) {
//        result.postTaxAmounts = postTaxAmounts;
//        result.yearsToFirstAccountDepletion = year;
//        result.yearsToDepletion = year + result.resultsSummary.yearsToDepletion;
//        this.resultsList.add(result);
//    }

    String getDebugChainString() {
        // TODO Implement traversal of debugChain
        return debugChain.stream().map(Object::toString).collect(Collectors.joining(", "));
    }

    void displayResults() {
        System.out.println();
        System.out.println();
        System.out.println();
        System.out.println("====================================");
        System.out.println("Results Summary");
        System.out.println("Years to Depletion: " + this.yearsToDepletion);

        ScenarioNode printResults = this;

        Integer index;
        Integer depletedAccountIndex = 0;
        int count = 1;
        try {
            do {
                System.out.println("Starting Amounts in Loop: " + count++);
                System.out.println(printResults.accounts);
                // print account totals at the start
                for (int i = 0; i < printResults.accounts.size(); i++) {
                    System.out.print("Account: " + printResults.accounts.get(i));
                    System.out.print(" has " + (int) printResults.startingAccountState.accounts.get(i).getTotalValue());
                    System.out.println(" Withdraw " + (Math.round(printResults.result.preTaxAmounts.get(i))));
                }

                depletedAccountIndex = printResults.result.indexOfFirstAccountDepletion;
                System.out.print("Until account: " + accounts.get(depletedAccountIndex));
                System.out.println(" is depleted in " + printResults.result.yearsToFirstAccountDepletion + " years");
                System.out.println("====================================");

//                if (printResults.result.resultsSummary != null) {
//                    printResults = printResults.result.resultsSummary;
//                }
            } while (printResults.accounts != null);
        }
        catch (Exception e) {
            System.out.println("Error: " + e);
        }
    }

    public void setDebugScenario(int i) {
        this.debugScenario = i;
    }

    public void findMaximumYearsToDepletionFromResults() {
        System.out.println("=============================================");
    }

    public ScenarioNode findOptimalChild() {
        double minYearsToDepletion = Double.MAX_VALUE;
        ScenarioNode optimalChild = null;
        // Traverse through all children and find the optimal one
        for(List<ScenarioNode> child : children){
            for(ScenarioNode node : child){
                if(node.yearsToDepletion < minYearsToDepletion){
                    optimalChild =  node;
                }
            }
        }
        return optimalChild;
    }

    /*
    ScenarioNode scenarioNode = new ScenarioNode.Builder()
    .setUser(user)
    .setAccounts(accounts)
    .setLevel(1)
    .setResult(result)
    .addChild(childList)
    .build();
     */

    public static class Builder {
        private AccountState startingAccountState;
        private AccountState endingAccountState;
        private List<String> accounts;
        private Integer level;
        private Scenario scenario;
        private List<List<ScenarioNode>> children = new ArrayList<>();
        private int debugScenario;

        public Builder setStartingAccountState(AccountState state) {
            this.startingAccountState = state;
            return this;
        }

        public Builder setEndingAccountState(AccountState state) {
            this.endingAccountState = state;
            return this;
        }

        public Builder setAccounts(List<String> accounts) {
            this.accounts = accounts;
            return this;
        }

        public Builder setLevel(Integer level) {
            this.level = level;
            return this;
        }

        public Builder setScenario(Scenario scenario) {
            this.scenario = scenario;
            return this;
        }

        public Builder addChild(List<ScenarioNode> child) {
            this.children.add(child);
            return this;
        }

        public ScenarioNode build() {
            ScenarioNode scenarioNode = new ScenarioNode();
            scenarioNode.startingAccountState = this.startingAccountState;
            scenarioNode.accounts = this.accounts;
            scenarioNode.level = this.level;
            scenarioNode.result = this.scenario;
            scenarioNode.children = this.children;
            scenarioNode.debugScenario = this.debugScenario;
            return scenarioNode;
        }

        public Builder setDebugScenario(int debugScenario) {
            this.debugScenario = debugScenario;
            return this;
        }
    }

    public ScenarioNode cloneNodeWithoutChildren(){
        return new ScenarioNode.Builder()
                .setStartingAccountState(this.startingAccountState)
                .setAccounts(this.accounts)
                .setLevel(this.level)
                .setDebugScenario(this.debugScenario)
                .build();
    }
}
