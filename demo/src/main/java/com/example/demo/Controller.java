package com.example.demo;

import com.example.demo.model.*;
import com.example.demo.repository.TaxBracketRepository;
import com.example.demo.service.ScenarioNode;

import com.example.demo.service.TaxMinimizationService;
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
    public String handleSubmit(@RequestBody FormData formData) {
        // Process formData
        System.out.println(formData);
        // create new account and run tax minimization
        AccountState startingAccountState = new AccountState.Builder()
                .withPostTaxAmountNeededPerYear(formData.getAmountPerYear())
                .withInterestRate(formData.getInterestRate())
                .addAccount(new TaxFreeAccount(formData.getTfsaAmount(), 0))
                .addAccount(new TaxDeferredAccount(formData.getRrspAmount(), 0))
                .addAccount(new TaxableAccount(formData.getMargAmountCapitalGain(), 500000))
                .build();

        ScenarioNode root = TaxMinimizationService.main(startingAccountState);

        return "Form submitted successfully";
    }

    @GetMapping(path = "/results")
    @CrossOrigin(origins = "http://localhost:4200")
    public @ResponseBody ArrayList<BurndownTimeEvent> getBurndown() {
        // This returns a JSON or XML with the users
        System.out.println("burndown getting");
        ScenarioNode root = new ScenarioNode();
        ArrayList<BurndownTimeEvent> burndown = root.readToFileAl("C:\\example\\demo\\burndown.ser");
        return burndown;
    }
}
