# UML Diagrams for Payroll Management System

## Use Case Diagram

```mermaid
usecaseDiagram
    actor Admin
    actor Employee

    package "Payroll Management System" {
        usecase "Manage Employees" as UC1
        usecase "Calculate Salary" as UC2
        usecase "Deduct Taxes" as UC3
        usecase "Generate Payslip" as UC4
        usecase "View Payslip" as UC5
    }

    Admin --> UC1
    Admin --> UC2
    Admin --> UC4
    UC2 ..> UC3 : <<include>>
    Employee --> UC5
```

## Class Diagram

```mermaid
classDiagram
    class Employee {
        -int id
        -String name
        -String department
        -String designation
        -double baseSalary
        -Date dateJoined
        +getId() int
        +getName() String
    }

    class Salary {
        -int id
        -int employeeId
        -int month
        -int year
        -double basePay
        -double allowances
        -double grossSalary
        -double taxDeduction
        -double otherDeductions
        -double netSalary
    }

    class Payslip {
        -int id
        -int salaryId
        -Date generationDate
        -String status
    }

    class DatabaseConnection {
        +getConnection() Connection
    }

    class PayrollService {
        +calculateSalary(Employee, int, int, double) Salary
        -calculateTax(double) double
    }
    
    class EmployeeDAO {
        +addEmployee(Employee)
        +getEmployee(int) Employee
    }

    class SalaryDAO {
        +saveSalary(Salary)
        +getSalary(int) Salary
    }

    Employee "1" -- "*" Salary : has
    Salary "1" -- "1" Payslip : generates
    PayrollService ..> Salary : creates
    PayrollService ..> Employee : uses
```

## Sequence Diagram

```mermaid
sequenceDiagram
    actor Admin
    participant GUI
    participant PayrollService
    participant SalaryDAO
    participant Database

    Admin->>GUI: Enter Employee ID & Allowances
    GUI->>PayrollService: calculateSalary(employee, month, year, allowances)
    activate PayrollService
    PayrollService->>PayrollService: calculateTax()
    PayrollService-->>GUI: Salary Object
    deactivate PayrollService
    GUI->>SalaryDAO: saveSalary(salary)
    activate SalaryDAO
    SalaryDAO->>Database: INSERT INTO salaries
    Database-->>SalaryDAO: Success
    SalaryDAO-->>GUI: Success Message
    deactivate SalaryDAO
    GUI-->>Admin: Display Calculation & Confirmation
```
