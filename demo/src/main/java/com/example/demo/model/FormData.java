package com.example.demo.model;

public class FormData {
    private double tfsaAmount;
    private double rrspAmount;
    private double margAmountPrincipal;
    private double margAmountCapitalGain;
    private double amountPerYear;

    public double getMargAmountPrincipal() {
        return margAmountPrincipal;
    }

    public void setMargAmountPrincipal(double margAmountPrincipal) {
        this.margAmountPrincipal = margAmountPrincipal;
    }

    public double getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(double interestRate) {
        this.interestRate = interestRate;
    }

    private double interestRate;
    private String province;

    // Constructors
    public FormData() {
        // Default constructor
    }

    // Getters and setters for each field
    public double getTfsaAmount() {
        return tfsaAmount;
    }

    public void setTfsaAmount(double tfsaAmount) {
        this.tfsaAmount = tfsaAmount;
    }

    public double getRrspAmount() {
        return rrspAmount;
    }

    public void setRrspAmount(double rrspAmount) {
        this.rrspAmount = rrspAmount;
    }

    public double getMargAmountCapitalGain() {
        return margAmountCapitalGain;
    }

    public void setMargAmountCapitalGain(double margAmountCapitalGain) {
        this.margAmountCapitalGain = margAmountCapitalGain;
    }

    public double getAmountPerYear() {
        return amountPerYear;
    }

    public void setAmountPerYear(double amountPerYear) {
        this.amountPerYear = amountPerYear;
    }

    public String getProvince() {
        return province;
    }

    public void setProvince(String province) {
        this.province = province;
    }

    // toString method for debugging
    @Override
    public String toString() {
        return "FormData{" +
                "input1='" + tfsaAmount + '\'' +
                ", input2='" + rrspAmount + '\'' +
                ", input3='" + margAmountCapitalGain + '\'' +
                ", input4='" + amountPerYear + '\'' +
                ", province='" + province + '\'' +
                '}';
    }
}
