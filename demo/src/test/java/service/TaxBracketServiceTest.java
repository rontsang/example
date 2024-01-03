package service;

import com.example.demo.service.TaxBracketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;
import org.testng.annotations.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@EnableAutoConfiguration
@ComponentScan
public class TaxBracketServiceTest {

    @Autowired
    private TaxBracketService taxBracketService;

    //autowire not working
    //https://stackoverflow.com/questions/55774891/autowired-not-working-in-spring-boot-test

    @Test
    public void testReadTaxBrackets() {
        System.out.println(taxBracketService.getAllTaxBrackets());
    }
}