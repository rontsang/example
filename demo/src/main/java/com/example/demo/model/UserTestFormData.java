package com.example.demo.model;

public class UserTestFormData {
    private double tfsaWithdraw;
    private double rrspWithdraw;
    private double margWithdraw;
    private double tfsaAmount;
    private double rrspAmount;
    private double margAmountPrincipal;
    private double margAmountCapitalGain;
    private double amountPerYear;
    private double income;
    private double startingYear;

    public double getStartingYear() {
        return startingYear;
    }

    public void setStartingYear(double startingYear) {
        this.startingYear = startingYear;
    }


    public double getIncome() {
        return income;
    }

    public void setIncome(double income) {
        this.income = income;
    }

    public double getTfsaWithdraw() {
        return tfsaWithdraw;
    }

    public void setTfsaWithdraw(double tfsaWithdraw) {
        this.tfsaWithdraw = tfsaWithdraw;
    }

    public double getRrspWithdraw() {
        return rrspWithdraw;
    }

    public void setRrspWithdraw(double rrspWithdraw) {
        this.rrspWithdraw = rrspWithdraw;
    }

    public double getMargWithdraw() {
        return margWithdraw;
    }

    public void setMargWithdraw(double margWithdraw) {
        this.margWithdraw = margWithdraw;
    }

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
    public UserTestFormData() {
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
