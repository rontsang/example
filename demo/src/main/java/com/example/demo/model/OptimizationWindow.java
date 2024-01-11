package com.example.demo.model;

// Data structure to hold optimization bracket
public class OptimizationWindow {
    public double upperBound;
    public double lowerBound;

    private OptimizationWindow(double lowerBound, double upperBound) {
        this.lowerBound = lowerBound;
        this.upperBound = upperBound;
    }
    public static OptimizationWindow init() {
        double upperBound = 1.0;
        double lowerBound = 0.0;

        return new OptimizationWindow(lowerBound, upperBound);
    }
}
