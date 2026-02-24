package com.example.demo.service;

import com.example.demo.model.AbstractTaxBracket;
import com.example.demo.model.TaxBracket;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaxBracketService {
    private final TaxBracketStore taxBracketStore;

    public TaxBracketService(TaxBracketStore taxBracketStore) {
        this.taxBracketStore = taxBracketStore;
    }
    public List<TaxBracket> getAllTaxBrackets() {
        return taxBracketStore.getTaxBrackets();
    }
}
