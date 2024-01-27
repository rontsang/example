package com.example.demo;

import com.example.demo.model.BurndownTimeEvent;
import com.example.demo.model.TaxBracket;
import com.example.demo.repository.TaxBracketRepository;
import com.example.demo.service.ScenarioNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping(path = "/results")
    @CrossOrigin(origins = "http://localhost:4200")
    public @ResponseBody ArrayList<BurndownTimeEvent> getBurndown() {
        // This returns a JSON or XML with the users
        System.out.println("burndown getting");
        ScenarioNode root = new ScenarioNode();
        ArrayList<BurndownTimeEvent> burndown = root.readToFileAl("C:\\tax\\demo\\burndown.ser");
        return burndown;
    }
}
