package com.example.demo.model;

import java.util.ArrayList;

// Data structure to hold optimization bracket
public class OptimizationWindow {
    public double upperBound;
    public double lowerBound;

    public OptimizationWindow(double lowerBound, double upperBound) {
        this.lowerBound = lowerBound;
        this.upperBound = upperBound;
    }

    public static ArrayList<OptimizationWindow> init(int i) {
        ArrayList<OptimizationWindow> optimizationWindows = new ArrayList<>();

        for(int j = 0; j < i; j++){
            optimizationWindows.add(init());
        }

        return optimizationWindows;
    }
    public static OptimizationWindow init() {
        double upperBound = 1.0;
        double lowerBound = 0.0;

        return new OptimizationWindow(lowerBound, upperBound);
    }
}
