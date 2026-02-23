package com.example.demo.repository;

import com.example.demo.model.FederalTaxBracket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaxBracketFederalRepository extends JpaRepository<FederalTaxBracket, Integer> {
}
