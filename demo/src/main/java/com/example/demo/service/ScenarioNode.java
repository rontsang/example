package com.example.demo.service;

import com.example.demo.model.AccountState;
import com.example.demo.model.BurndownTimeEvent;
import com.example.demo.model.OptimizationWindow;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

public class ScenarioNode implements Serializable {
    ArrayList<OptimizationWindow> optimizationWindows = new ArrayList<>();
    List<ScenarioNode> children = new ArrayList<>();
    public ArrayList<ScenarioNode> optimalNodes = new ArrayList<>();
    ScenarioNode optimalChild = null;
    AccountState startingAccountState;
    AccountState endingAccountState;
    Integer level = 0;
    public Scenario scenario = new Scenario();

    double yearsToDepletion = Double.MAX_VALUE;
    List<Double> optimalWindow;
    int optimalIndex;
    int debugScenario = 0;


    public void addChild(ScenarioNode child) {
        children.add(child);
    }

    public ScenarioNode getChild(int index) {
        return this.children.isEmpty() ? null: this.children.get(index);
    }
    
    public ScenarioNode() {}

    void getOptimalChildAndYearsToDepletion() {
        setOptimalChild();
        setYearsToDepletion();
    }

    private void setYearsToDepletion() {
        if(this.scenario != null)  {
            this.yearsToDepletion = this.scenario.yearsToFirstAccountDepletion;
        }
        if(this.optimalChild != null){
            this.yearsToDepletion += this.optimalChild.yearsToDepletion;
        }
    }

    private void setOptimalChild() {
        if(this.optimalNodes.size() > 0) {
            getOptimalChildFromOptimalNodeList();
        }
        else if(!children.isEmpty()) {
            getOptimalChildFromChildrenList();
        }
    }

    private void getOptimalChildFromOptimalNodeList() {
        ScenarioNode lastOptimizedNode = this.optimalNodes.get(this.optimalNodes.size() - 1);
        lastOptimizedNode.getOptimalChildAndYearsToDepletion();
        this.optimalChild = lastOptimizedNode.optimalChild;
        this.optimalWindow = lastOptimizedNode.optimalWindow;
        this.optimalIndex = lastOptimizedNode.optimalIndex;
    }

    private void getOptimalChildFromChildrenList() {
        for (int i = 0; i < children.size(); i++) {
            ScenarioNode child = children.get(i);
            child.getOptimalChildAndYearsToDepletion();
            if (this.optimalChild == null || child.yearsToDepletion > this.optimalChild.yearsToDepletion) {;
                this.optimalChild = child;
                this.optimalWindow = child.optimalWindow;
                this.optimalIndex = i;
            }
        }
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
            scenarioNode.scenario = this.scenario;
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

    public void saveToFile(Object object, String name) {
        try {
            FileOutputStream fileOut = new FileOutputStream(name);
            ObjectOutputStream objectOut = new ObjectOutputStream(fileOut);
            objectOut.writeObject(object);
            objectOut.close();
            fileOut.close();
            System.out.println("The Object was successfully written to a file");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    public Object readToFile(String name) {
        Object readNode = new Object();
        try {
            FileInputStream fileIn = new FileInputStream(name);
            ObjectInputStream objectIn = new ObjectInputStream(fileIn);
            readNode = (Object) objectIn.readObject();
            objectIn.close();
            fileIn.close();
            System.out.println("The Object has been read from the file");
            // Use myObj as needed
        } catch (IOException | ClassNotFoundException e) {
            e.printStackTrace();
        }
        return readNode;
    }

    public ArrayList<BurndownTimeEvent> readToFileAl(String name) {
        ArrayList<BurndownTimeEvent> readList = null;
        try {
            FileInputStream fileIn = new FileInputStream(name);
            ObjectInputStream objectIn = new ObjectInputStream(fileIn);
            readList = (ArrayList<BurndownTimeEvent>) objectIn.readObject();
            objectIn.close();
            fileIn.close();
            System.out.println("The ArrayList<Object> has been read from the file");
        } catch (IOException | ClassNotFoundException e) {
            e.printStackTrace();
        }
        return readList;
    }
}
