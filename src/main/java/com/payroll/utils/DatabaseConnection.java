package com.payroll.utils;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConnection {
    private static final String URL = System.getenv().getOrDefault(
            "DB_URL", "jdbc:postgresql://localhost:5432/payroll_db");
    private static final String USER = System.getenv().getOrDefault("DB_USERNAME", "postgres");
    private static final String PASSWORD = System.getenv().getOrDefault("DB_PASSWORD", "");

    public static Connection getConnection() {
        Connection conn = null;
        try {
            Class.forName("org.postgresql.Driver");
            conn = DriverManager.getConnection(URL, USER, PASSWORD);
        } catch (ClassNotFoundException e) {
            System.err.println("PostgreSQL Driver not found.");
            e.printStackTrace();
        } catch (SQLException e) {
            System.err.println("Connection failed. Check your PostgreSQL server, username, and password.");
            e.printStackTrace();
        }
        return conn;
    }
}
