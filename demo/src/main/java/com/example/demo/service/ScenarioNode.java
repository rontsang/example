package com.example.demo.service;

import com.example.demo.model.AccountState;
import com.example.demo.model.OptimizationWindow;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class ScenarioNode {
    public ArrayList<ScenarioNode> optimalNodes = new ArrayList<>();

    ArrayList<OptimizationWindow> optimizationWindows = new ArrayList<>();

    ScenarioNode optimalChild = null;

    // Tree Structure
    // List contains the iterations (only the optimal one needs a list of iterations)
    // Each iteration contains a list of the children of each combination
    List<ScenarioNode> children = new ArrayList<>();

    // INPUTS
    AccountState startingAccountState;
    AccountState endingAccountState;
    Integer level = 0;
    Scenario result = new Scenario();

    public void addChild(ScenarioNode child) {
        children.add(child);
    }

    public ScenarioNode getChild(int index) {
        return this.children.isEmpty() ? null: this.children.get(index);
    }

    List<Integer> debugChain = new ArrayList<>();

    // OUTPUTS
    double yearsToDepletion = Double.MAX_VALUE;
    List<Double> optimalWindow;
    int optimalIndex;
    int debugScenario = 0;

    public ScenarioNode() {}

    void getOptimalChildAndSetYearsToDepletion() {
        if(this.optimalNodes.size() > 0) {
            getOptimalChildFromOptimalNodeList();
        }
        else if(!children.isEmpty()) {
            getOptimalChildFromChildrenList();
        }

        if(this.result != null)  {
            this.yearsToDepletion = this.result.yearsToFirstAccountDepletion;
        }
        if(this.optimalChild != null){
            this.yearsToDepletion += this.optimalChild.yearsToDepletion;
        }
    }

    private void getOptimalChildFromOptimalNodeList() {
        ScenarioNode lastOptimizedNode = this.optimalNodes.get(this.optimalNodes.size() - 1);
        lastOptimizedNode.getOptimalChildAndSetYearsToDepletion();
        this.optimalChild = lastOptimizedNode.optimalChild;
        this.optimalWindow = lastOptimizedNode.optimalWindow;
        this.optimalIndex = lastOptimizedNode.optimalIndex;
    }

    private void getOptimalChildFromChildrenList() {
        for (int i = 0; i < children.size(); i++) {
            ScenarioNode child = children.get(i);
            child.getOptimalChildAndSetYearsToDepletion();
            if (this.optimalChild == null || child.yearsToDepletion < this.optimalChild.yearsToDepletion) {;
                this.optimalChild = child;
                this.optimalWindow = child.optimalWindow;
                this.optimalIndex = i;
            }
        }
    }

    String getDebugChainString() {
        // TODO Implement traversal of debugChain
        return debugChain.stream().map(Object::toString).collect(Collectors.joining(", "));
    }

    ScenarioNode getCurrentOptimizationNode() {
        return this.optimalNodes.get(this.optimalNodes.size() - 1);
    }

    void displayResults() {
        System.out.println("====================================");
        System.out.println("Results Summary");
        System.out.println("====================================");
    }

    double getNumAccounts(){
        return this.startingAccountState.accounts.size();
    }
//        System.out.println();
//        System.out.println();
//        System.out.println();
//        System.out.println("====================================");
//        System.out.println("Results Summary");
//        System.out.println("Years to Depletion: " + this.yearsToDepletion);
//
//        ScenarioNode printResults = this;
//
//        Integer index;
//        Integer depletedAccountIndex = 0;
//        int count = 1;
//        try {
//            do {
//                System.out.println("Starting Amounts in Loop: " + count++);
//                System.out.println(printResults.accounts);
//                // print account totals at the start
//                for (int i = 0; i < printResults.accounts.size(); i++) {
//                    System.out.print("Account: " + printResults.accounts.get(i));
//                    System.out.print(" has " + (int) printResults.startingAccountState.accounts.get(i).getTotalValue());
//                    System.out.println(" Withdraw " + (Math.round(printResults.result.preTaxAmounts.get(i))));
//                }
//
//                depletedAccountIndex = printResults.result.indexOfFirstAccountDepletion;
//                System.out.print("Until account: " + accounts.get(depletedAccountIndex));
//                System.out.println(" is depleted in " + printResults.result.yearsToFirstAccountDepletion + " years");
//                System.out.println("====================================");
//
////                if (printResults.result.resultsSummary != null) {
////                    printResults = printResults.result.resultsSummary;
////                }
//            } while (printResults.accounts != null);
//        }
//        catch (Exception e) {
//            System.out.println("Error: " + e);
//        }
//    }

    public void setDebugScenario(int i) {
        this.debugScenario = i;
    }

    public void findMaximumYearsToDepletionFromResults() {
        System.out.println("=============================================");
    }

    public ArrayList<OptimizationWindow> getOptimizationWindows() {
        ArrayList<OptimizationWindow> optimizationWindows;
        if(this.optimizationWindows == null || this.optimizationWindows.isEmpty()){
            optimizationWindows = OptimizationWindow.init(this.startingAccountState.accounts.size());
        } else{
            optimizationWindows = this.optimizationWindows;
        }
        return optimizationWindows;
    }


    public static class Builder {
        private AccountState startingAccountState;
        private AccountState endingAccountState;
        private List<String> accounts;
        private Integer level;
        private Scenario scenario;
        private List<ScenarioNode> children = new ArrayList<>();
        private int debugScenario;

        private ArrayList<OptimizationWindow> optimizationWindows;

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

        public Builder addChild(ScenarioNode child) {
            this.children.add(child);
            return this;
        }

        public Builder setDebugScenario(int debugScenario) {
            this.debugScenario = debugScenario;
            return this;
        }

        public Builder setOptimizationWindows(ArrayList<OptimizationWindow> optimizationWindows) {
            this.optimizationWindows = optimizationWindows;
            return this;
        }

        public ScenarioNode build() {
            ScenarioNode scenarioNode = new ScenarioNode();
            scenarioNode.startingAccountState = this.startingAccountState;
            scenarioNode.endingAccountState = this.endingAccountState;
            scenarioNode.optimizationWindows = this.optimizationWindows;
            scenarioNode.level = this.level;
            scenarioNode.result = this.scenario;
            scenarioNode.children = this.children;
            scenarioNode.debugScenario = this.debugScenario;
            return scenarioNode;
        }

    }


    public ScenarioNode cloneNodeWithoutChildren(){
        return new ScenarioNode.Builder()
                .setStartingAccountState(this.startingAccountState)
                .setLevel(this.level)
                .setDebugScenario(this.debugScenario)
                .build();
    }
}
