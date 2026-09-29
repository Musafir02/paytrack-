package com.payroll;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.payroll.config.LocalPostgresInitializer;

@SpringBootApplication
public class PayrollApplication {

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(PayrollApplication.class);
        application.addInitializers(new LocalPostgresInitializer());
        application.run(args);
    }
}
