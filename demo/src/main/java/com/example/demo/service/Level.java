package com.example.demo.service;

import java.util.ArrayList;
import java.util.List;

public class Level {

    public UserAccounts userAccounts;

    double yearsToDepletion = Double.MAX_VALUE;

    private List<UserAccounts> accounts;

    ArrayList<Results> resultsList;

    public Level(List<UserAccounts> accounts) {
        this.accounts = accounts;
        this.resultsList = new ArrayList<>();
    }
}
