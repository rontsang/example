package com.example.demo;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class Controller {

    @GetMapping("/hello")
    @CrossOrigin(origins = "http://localhost:4200")
    public String helloWorld() {
        return "Hello, World!";
    }
}
