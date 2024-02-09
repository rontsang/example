package com.example.demo;

import com.example.demo.model.*;
import com.example.demo.repository.TaxBracketRepository;
import com.example.demo.service.ScenarioNode;

import com.example.demo.service.TaxMinimizationService;
import com.example.demo.service.TaxSimulationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;

@RestController
public class Controller {
    @Autowired
    private TaxBracketRepository taxBracketRepository;

    @GetMapping("/hello")
    @CrossOrigin(origins = "http://localhost:4200")
    public ResponseEntity<String> helloWorld() {
        return ResponseEntity.ok("Hello, World!");
    }

    @GetMapping(path = "/all")
    @CrossOrigin(origins = "http://localhost:4200")
    public @ResponseBody Iterable<TaxBracket> getAllBrackets() {
        // This returns a JSON or XML with the users
        System.out.println("hello");
        return taxBracketRepository.findAll();
    }

    @PostMapping("/submit-form")
    @CrossOrigin(origins = "http://localhost:4200")
    public @ResponseBody ArrayList<BurndownTimeEvent> handleSubmit(@RequestBody FormData formData) {
        // Process formData
        System.out.println(formData);
        // create new account and run tax minimization
        AccountState startingAccountState = new AccountState.Builder()
                .withPostTaxAmountNeededPerYear(formData.getAmountPerYear())
                .withInterestRate(formData.getInterestRate())
                .withIncome(formData.getIncome())
                .addAccount(new TaxFreeAccount(formData.getTfsaAmount(), 0))
                .addAccount(new TaxDeferredAccount(formData.getRrspAmount(), 0))
                .addAccount(new TaxableAccount(formData.getMargAmountPrincipal(), formData.getMargAmountCapitalGain()))
                .build();

        ScenarioNode root = TaxMinimizationService.main(startingAccountState);
        System.out.println("burndown getting");
//        ScenarioNode root = new ScenarioNode();
        if(root == null){
            return null;
//            Double allAccountsTotal = startingAccountState.accounts.stream().mapToDouble(account -> account.getTotalValue()).sum();
//            Double interestPerYearEstimate = allAccountsTotal * startingAccountState.interestRate;
//            startingAccountState.postTaxAmountNeededPerYear = interestPerYearEstimate*1.5;
//            root = TaxMinimizationService.main(startingAccountState);
//            ArrayList<BurndownTimeEvent> burndown = (ArrayList<BurndownTimeEvent>) root.readToFile("C:\\example\\demo\\burndown.ser");
//            return burndown;
        }


        ArrayList<BurndownTimeEvent> burndown = (ArrayList<BurndownTimeEvent>) root.readToFile("C:\\example\\demo\\burndown.ser");
        return burndown;
//        return "{\"message\": \"Form submitted successfully\"}";
    }

    @PostMapping("/user-test")
    @CrossOrigin(origins = "http://localhost:4200")
    public @ResponseBody ArrayList<BurndownTimeEvent> handleTest(@RequestBody UserTestFormData formData) {
        // Process formData
        System.out.println(formData);
        // create new account and run tax minimization
        AccountState startingAccountState = new AccountState.Builder()
                .withInterestRate(formData.getInterestRate())
                .withIncome(formData.getIncome())
                .addAccount(new TaxFreeAccount(formData.getTfsaAmount(), 0))
                .addAccount(new TaxDeferredAccount(formData.getRrspAmount(), 0))
                .addAccount(new TaxableAccount(formData.getMargAmountPrincipal(), formData.getMargAmountCapitalGain()))
                .build();

        ArrayList<Double> withdrawal = new ArrayList<>();
        withdrawal.add(formData.getTfsaWithdraw());
        withdrawal.add(formData.getRrspWithdraw());
        withdrawal.add(formData.getMargWithdraw());


        ScenarioNode root = TaxSimulationService.main(startingAccountState, withdrawal);

        // return burndown (contains burndown)
        // return post tax amount total


//        System.out.println("burndown getting");
//        ScenarioNode root = new ScenarioNode();
        if(root == null){
            return null;
        }


        ArrayList<BurndownTimeEvent> burndown = (ArrayList<BurndownTimeEvent>) root.readToFile("C:\\example\\demo\\burndown.ser");
        return burndown;
    }

    @GetMapping(path = "/results")
    @CrossOrigin(origins = "http://localhost:4200")
    public @ResponseBody ArrayList<BurndownTimeEvent> getBurndown() {
        // This returns a JSON or XML with the users
        System.out.println("burndown getting");
        ScenarioNode root = new ScenarioNode();
//        ArrayList<BurndownTimeEvent> burndown = null;
        ArrayList<BurndownTimeEvent> burndown = root.readToFileAl("C:\\example\\demo\\burndown.ser");
        return burndown;
    }
}
