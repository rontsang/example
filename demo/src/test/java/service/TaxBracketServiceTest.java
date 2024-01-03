package service;

import com.example.demo.service.TaxBracketService;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.junit4.SpringRunner;
//import org.junit.jupiter.api.Test;
import org.junit.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Arrays;

@SpringBootTest
@EnableAutoConfiguration
@ComponentScan(basePackages = {"com.example.demo"})
@RunWith(SpringJUnit4ClassRunner.class)
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes=TaxBracketService.class)
public class TaxBracketServiceTest {
    @Autowired
    private ApplicationContext context;
    @Autowired
    private TaxBracketService taxBracketService;

    //autowire not working
    //https://stackoverflow.com/questions/55774891/autowired-not-working-in-spring-boot-test

    @Test
    public void testReadTaxBrackets() {
        String[] beanNames = context.getBeanDefinitionNames();
        Arrays.sort(beanNames);
        for (String beanName : beanNames) {
            System.out.println(beanName);
        }
        System.out.println(taxBracketService.getAllTaxBrackets());
    }
}