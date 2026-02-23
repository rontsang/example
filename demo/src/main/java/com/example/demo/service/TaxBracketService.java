package com.example.demo.service;

import com.example.demo.model.AbstractTaxBracket;
import com.example.demo.model.TaxBracket;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.demo.repository.TaxBracketRepository;

import java.util.List;

@Service
public class TaxBracketService {
    @Autowired
    private TaxBracketRepository taxBracketRepository;

    public TaxBracketService(TaxBracketRepository taxBracketRepository) {
        this.taxBracketRepository = taxBracketRepository;
    }
    public List<TaxBracket> getAllTaxBrackets() {
        return taxBracketRepository.findAll();
    }
}
