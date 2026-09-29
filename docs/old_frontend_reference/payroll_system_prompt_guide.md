# Java Swing Payroll System: Design and Development Guide

## 1. The "Golden" Prompt Structure
When interacting with an AI (like Gemini, GitHub Copilot, or Stitch), use this template to get production-ready Java Swing code:

**Role:** "Act as a Senior Java Developer specializing in Swing UI and JDBC."
**Task:** "Create a Java Swing JFrame class for a [Screen Name, e.g., Salary Calculation Module]. Include a JPanel with a GridBagLayout for a clean, professional layout."

### Technical Requirements:
*   **UI Components:** Include `JTextField` for inputs, a `JTable` to display data from the payroll table, and a `JButton` for 'Calculate'.
*   **Database:** Use a `PreparedStatement` within a dedicated `PayrollDAO` class pattern to ensure security and prevent SQL injection.
*   **Logic:** Add an `ActionListener` to the calculate button that triggers a simple salary computation logic.

### Constraints:
*   Follow Java naming conventions.
*   Modularize the code (separate UI logic from database connection logic).
*   Include comments explaining the layout and database handling.

---

## 2. Tailored Prompts for Your Project Modules

### For Database Schema:
> "Generate a SQL script for a MySQL database named payroll_db. Include tables for Employees (id, name, role) and Payroll (id, employee_id, basic_salary, tax, net_salary). Ensure employee_id is a foreign key with an ON DELETE CASCADE constraint."

### For Salary Calculation Logic:
> "Write a Java method that calculates net salary based on basic_salary. Deduct 10% for tax and 5% for professional tax. Return the final net_salary as a double. Include a corresponding JUnit test case that checks for correct calculation with an input of 50,000."

### For UML Class Diagram (PlantUML):
> "Generate PlantUML code for a Class Diagram showing the relationships between Employee, PayrollService, and DatabaseConnector classes. Include private fields and public methods for each."

---

## 3. Tips for Best Results
*   **Chain-of-Thought:** If the project is complex, don't ask for the "whole system" at once. Ask for the Database Layer first, then the UI Layout, then the Action Listeners.
*   **Context is King:** Always provide your existing package structure. Example: "I have a package `com.payroll.db`. Please generate code that fits into this structure."
*   **Verification:** AI-generated code is a starting point. Always run the generated code in your IDE and use JUnit to verify the logic.