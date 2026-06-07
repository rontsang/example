package com.example.demo;

import com.example.demo.model.*;
import com.example.demo.service.ScenarioNode;
import com.example.demo.service.TaxBracketStore;

import com.example.demo.service.TaxMinimizationService;
import com.example.demo.service.TaxSimulationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;

@RestController
public class Controller {
    private static final Logger log = LoggerFactory.getLogger(Controller.class);

    @Autowired
    private TaxBracketStore taxBracketStore;

    @GetMapping("/hello")
    @CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4021"})
    public ResponseEntity<String> helloWorld() {
        return ResponseEntity.ok("Hello, World!");
    }

    @GetMapping(path = "/all")
    @CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4021"})
    public @ResponseBody Iterable<TaxBracket> getAllBrackets() {
        // This returns a JSON or XML with the users
        log.info("hello");
        return taxBracketStore.getTaxBrackets();
    }

    @PostMapping("/submit-form")
    @CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4021"})
    public @ResponseBody ArrayList<BurndownTimeEvent> handleSubmit(@RequestBody FormData formData) {
        // Process formData
        log.info("{}", formData);
        // create new account and run tax minimization
        AccountState startingAccountState = new AccountState.Builder()
                .withPostTaxAmountNeededPerYear(formData.getAmountPerYear())
                .withInterestRate(formData.getInterestRate())
                .withIncome(formData.getIncome())
                .addAccount(new TaxFreeAccount(formData.getTfsaAmount(), 0))
                .addAccount(new TaxDeferredAccount(formData.getRrspAmount(), 0))
                .addAccount(new TaxableAccount(Math.max(0, formData.getMargAmountPrincipal() - formData.getMargAmountCapitalGain()), formData.getMargAmountCapitalGain()))
                .build();

        log.info("burndown getting");
        return TaxMinimizationService.computeBurndown(startingAccountState);
//        return "{\"message\": \"Form submitted successfully\"}";
    }

    @PostMapping("/user-test")
    @CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4021"})
    public @ResponseBody ArrayList<BurndownTimeEvent> handleTest(@RequestBody UserTestFormData formData) {
        // Process formData
        log.info("{}", formData);
        // create new account and run tax minimization
        AccountState startingAccountState = new AccountState.Builder()
                .withInterestRate(formData.getInterestRate())
                .withIncome(formData.getIncome())
                .addAccount(new TaxFreeAccount(formData.getTfsaAmount(), 0))
                .addAccount(new TaxDeferredAccount(formData.getRrspAmount(), 0))
                .addAccount(new TaxableAccount(Math.max(0, formData.getMargAmountPrincipal() - formData.getMargAmountCapitalGain()), formData.getMargAmountCapitalGain()))
                .build();

        ArrayList<Double> withdrawal = new ArrayList<>();
        withdrawal.add(formData.getTfsaWithdraw());
        withdrawal.add(formData.getRrspWithdraw());
        withdrawal.add(formData.getMargWithdraw());
        return TaxSimulationService.computeBurndown(startingAccountState, withdrawal, formData.getStartingYear());
    }

    @GetMapping(path = "/results")
    @CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4021"})
    public @ResponseBody ArrayList<BurndownTimeEvent> getBurndown() {
        // This returns a JSON or XML with the users
        log.info("burndown getting");
        log.warn("/results is not available without the filesystem-backed burndown.ser");
        return null;
    }
}
