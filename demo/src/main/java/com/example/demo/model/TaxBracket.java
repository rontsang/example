package com.example.demo.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "tax_bracket")
public class TaxBracket {
    @Id
    private Integer index;
    private Double upper_bound;
    private Double lower_bound;
    private Double rate;

    public Integer getIndex() {
        return index;
    }

    public void setIndex(Integer index) {
        this.index = index;
    }

    public Double getUpper_bound() {
        return upper_bound;
    }

    public void setUpper_bound(Double upper_bound) {
        this.upper_bound = upper_bound;
    }

    public Double getLower_bound() {
        return lower_bound;
    }

    public void setLower_bound(Double lower_bound) {
        this.lower_bound = lower_bound;
    }

    public Double getRate() {
        return rate;
    }

    public void setRate(Double rate) {
        this.rate = rate;
    }

}
