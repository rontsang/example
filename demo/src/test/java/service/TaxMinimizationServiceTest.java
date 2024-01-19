package service;

import com.example.demo.model.TaxDeferredAccount;
import com.example.demo.model.TaxableAccount;
import com.example.demo.model.User;
import com.example.demo.model.TaxFreeAccount;
import com.example.demo.service.TaxMinimizationService;
import org.junit.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.runner.RunWith;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

// For mystery reasons, we need all five annotations to run tests...
@SpringBootTest
@EnableAutoConfiguration
@ComponentScan(basePackages = {"com.example.demo"})
@RunWith(SpringJUnit4ClassRunner.class)
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes= TaxMinimizationService.class)
public class TaxMinimizationServiceTest {

    @Test
    public void testReadTaxBrackets() {
        while(true){
            try{
                User user = new User.Builder()
                        .withPostTaxAmountNeededPerYear(175000)
                        .withInterestRate(0.05)
                        .addAccount(new TaxFreeAccount(500000, 0))
                        .addAccount(new TaxDeferredAccount(500000, 0))
//                        .addAccount(new TaxableAccount(300000, 500000))
                        .build();
                TaxMinimizationService.main(user);
            } catch(Exception e){
                System.out.println(e);
            }
        }
    }
}