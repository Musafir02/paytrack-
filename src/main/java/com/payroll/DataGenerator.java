package com.payroll;

import com.payroll.utils.DatabaseConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Date;
import java.util.Random;

public class DataGenerator {
    public static void main(String[] args) {
        String[] firstNames = {"John", "Jane", "Alice", "Bob", "Charlie", "David", "Emma", "Fiona", "George", "Hannah", "Isaac", "Julia"};
        String[] lastNames = {"Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"};
        String[] departments = {"Engineering", "Human Resources", "Sales", "Marketing", "Finance", "Legal", "Operations"};
        String[] designations = {"Analyst", "Manager", "Developer", "Designer", "Director", "Consultant", "Executive"};

        String query = "INSERT INTO employees (name, surname, age, department, designation, base_salary, date_joined) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(query)) {
            
            conn.setAutoCommit(false);
            Random random = new Random();

            for (int i = 1; i <= 50000; i++) {
                String fName = firstNames[random.nextInt(firstNames.length)];
                String lName = lastNames[random.nextInt(lastNames.length)];
                int age = 22 + random.nextInt(40); // 22 to 61
                String dept = departments[random.nextInt(departments.length)];
                String desig = designations[random.nextInt(designations.length)];
                double salary = 30000 + (random.nextDouble() * 70000); // 30k to 100k
                
                // Random date in the last 10 years
                long ms = System.currentTimeMillis() - (Math.abs(random.nextLong()) % (10L * 365 * 24 * 60 * 60 * 1000));
                Date dateJoined = new Date(ms);

                pstmt.setString(1, fName);
                pstmt.setString(2, lName);
                pstmt.setInt(3, age);
                pstmt.setString(4, dept);
                pstmt.setString(5, desig);
                pstmt.setDouble(6, salary);
                pstmt.setDate(7, dateJoined);
                
                pstmt.addBatch();

                if (i % 1000 == 0) {
                    pstmt.executeBatch();
                    System.out.println("Inserted " + i + " records...");
                }
            }
            pstmt.executeBatch();
            conn.commit();
            System.out.println("Successfully generated 50,000 employees!");

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
