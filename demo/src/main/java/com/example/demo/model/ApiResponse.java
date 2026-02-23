package com.example.demo.model;

public class ApiResponse<T> {
    private T data;
    private String error;

    // Constructors, getters, setters
    public ApiResponse(T data) {
        this.data = data;
    }

    public ApiResponse(String error) {
        this.error = error;
    }

    // Getters and Setters
}