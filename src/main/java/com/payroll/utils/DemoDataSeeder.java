package com.payroll.utils;

import com.payroll.dto.PayrollProcessRequest;
import com.payroll.dto.UserCreationRequest;
import com.payroll.model.AttendanceRecord;
import com.payroll.model.Department;
import com.payroll.model.Employee;
import com.payroll.model.LeaveBalance;
import com.payroll.model.LeaveRequest;
import com.payroll.model.SalaryStructure;
import com.payroll.repository.AttendanceRecordRepository;
import com.payroll.repository.DepartmentRepository;
import com.payroll.repository.EmployeeRepository;
import com.payroll.repository.LeaveBalanceRepository;
import com.payroll.repository.LeaveRequestRepository;
import com.payroll.repository.PayrollRecordRepository;
import com.payroll.repository.SalaryStructureRepository;
import com.payroll.service.PayrollService;
import com.payroll.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Opt-in demo data seeder.
 *
 * <p>Only ever runs when the "demo" Spring profile is active. Normal startups are untouched.
 * Every generated row is tagged with a DEMO- prefix so it can be identified or removed later.
 */
@Component
@Profile("demo")
@ConditionalOnProperty(name = "app.demo-data.enabled", havingValue = "true")
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    private static final String PASSWORD = "Demo@1234";
    private static final String CODE_PREFIX = "DEMO-";

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final PayrollRecordRepository payrollRecordRepository;
    private final UserService userService;
    private final PayrollService payrollService;

    public DemoDataSeeder(DepartmentRepository departmentRepository,
                          EmployeeRepository employeeRepository,
                          SalaryStructureRepository salaryStructureRepository,
                          AttendanceRecordRepository attendanceRecordRepository,
                          LeaveRequestRepository leaveRequestRepository,
                          LeaveBalanceRepository leaveBalanceRepository,
                          PayrollRecordRepository payrollRecordRepository,
                          UserService userService,
                          PayrollService payrollService) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.payrollRecordRepository = payrollRecordRepository;
        this.userService = userService;
        this.payrollService = payrollService;
    }

    /** Employee seed row: identity, department, role and salary band. */
    private static final class Emp {
        final String code, first, last, gender, designation, role;
        final String deptCode;
        final BigDecimal basic;
        final int age;

        Emp(String code, String first, String last, String gender, String deptCode,
            String designation, String role, BigDecimal basic, int age) {
            this.code = code;
            this.first = first;
            this.last = last;
            this.gender = gender;
            this.deptCode = deptCode;
            this.designation = designation;
            this.role = role;
            this.basic = basic;
            this.age = age;
        }
    }

    @Override
    @Transactional
    public void run(String... args) {
        long existing = employeeRepository.count();
        if (existing > 0) {
            log.warn("Demo seeder: database already holds {} employee(s). Demo rows will be ADDED "
                    + "alongside existing data (nothing is deleted).", existing);
        }

        List<Department> departments = seedDepartments();
        List<Employee> employees = seedEmployees();
        seedAccounts(employees);
        seedSalaryStructures(employees);
        seedAttendance(employees);
        seedPayroll(employees);
        seedLeaveBalances(employees);
        seedLeaveRequests(employees, departments);

        log.info("");
        log.info("================ DEMO DATA SEEDED ================");
        log.info("  Departments (new) : {}", departments.size());
        log.info("  Employees   (new) : {}", employees.size());
        log.info("  Attendance        : {} records (last 30 days)",
                attendanceRecordRepository.count());
        log.info("  Payroll records   : {} (year to date)", payrollService.getAllPayrollRecords().size());
        log.info("  Leave requests    : {}", leaveRequestRepository.count());
        log.info("");
        log.info("  Demo logins (password for all: {})", PASSWORD);
        log.info("    admin        : demo.admin");
        log.info("    hr           : demo.hr");
        log.info("    mgr eng      : demo.mgr.eng");
        log.info("    mgr sales    : demo.mgr.sls");
        log.info("    mgr finance  : demo.mgr.fin");
        log.info("    employees    : demo.emp01 .. demo.emp15");
        log.info("=================================================");
        log.info("");
    }

    private static final String[][] DEPTS = {
            {"Engineering", "ENG", "Product engineering and platform work"},
            {"Sales", "SLS", "Revenue, accounts and partnerships"},
            {"Finance", "FIN", "Accounting, payroll and treasury"},
            {"Human Resources", "HR", "Talent, hiring and people ops"},
            {"Support", "SUP", "Customer support and IT helpdesk"},
    };

    private List<Department> seedDepartments() {
        List<Department> result = new ArrayList<>();
        for (String[] d : DEPTS) {
            String code = CODE_PREFIX + d[1];
            Department dept = departmentRepository.findByCode(code).orElseGet(Department::new);
            if (dept.getId() == null) {
                dept.setName(d[0]);
                dept.setCode(code);
                dept.setDescription(d[2]);
                dept = departmentRepository.save(dept);
                log.info("Demo seeder: created department {}", code);
            }
            result.add(dept);
        }
        return result;
    }

    private static final Emp[] EMPS = {
            // 3 managers - one per operational department
            new Emp("DEMO-M01", "Aarav", "Sharma", "MALE", "ENG", "Engineering Manager", "MANAGER", bd(95000), 38),
            new Emp("DEMO-M02", "Diya", "Kapoor", "FEMALE", "SLS", "Sales Manager", "MANAGER", bd(88000), 35),
            new Emp("DEMO-M03", "Rohan", "Mehta", "MALE", "FIN", "Finance Manager", "MANAGER", bd(92000), 41),

            // HR head + admin (each is also a normal employee record)
            new Emp("DEMO-H01", "Priya", "Nair", "FEMALE", "HR", "HR Business Partner", "HR", bd(78000), 33),
            new Emp("DEMO-A01", "Vikram", "Singh", "MALE", "SUP", "IT Administrator", "ADMIN", bd(81000), 36),

            // 10 employees, 2 per department
            new Emp("DEMO-E01", "Ananya", "Iyer", "FEMALE", "ENG", "Senior Software Engineer", "EMPLOYEE", bd(72000), 29),
            new Emp("DEMO-E02", "Kabir", "Rao", "MALE", "ENG", "Software Engineer", "EMPLOYEE", bd(58000), 25),
            new Emp("DEMO-E03", "Isha", "Patel", "FEMALE", "SLS", "Senior Account Executive", "EMPLOYEE", bd(62000), 30),
            new Emp("DEMO-E04", "Arjun", "Menon", "MALE", "SLS", "Account Executive", "EMPLOYEE", bd(45000), 23),
            new Emp("DEMO-E05", "Neha", "Gupta", "FEMALE", "FIN", "Senior Accountant", "EMPLOYEE", bd(60000), 31),
            new Emp("DEMO-E06", "Sameer", "Joshi", "MALE", "FIN", "Accounts Executive", "EMPLOYEE", bd(42000), 24),
            new Emp("DEMO-E07", "Kavya", "Reddy", "FEMALE", "HR", "HR Executive", "EMPLOYEE", bd(40000), 26),
            new Emp("DEMO-E08", "Manish", "Yadav", "MALE", "HR", "Recruitment Associate", "EMPLOYEE", bd(38000), 27),
            new Emp("DEMO-E09", "Sneha", "Das", "FEMALE", "SUP", "Support Specialist", "EMPLOYEE", bd(36000), 25),
            new Emp("DEMO-E10", "Nikhil", "Chatterjee", "MALE", "SUP", "Helpdesk Analyst", "EMPLOYEE", bd(33000), 22),
            new Emp("DEMO-E11", "Devika", "Bose", "FEMALE", "ENG", "QA Engineer", "EMPLOYEE", bd(52000), 28),
            new Emp("DEMO-E12", "Aditya", "Kulkarni", "MALE", "ENG", "Platform Engineer", "EMPLOYEE", bd(67000), 30),
            new Emp("DEMO-E13", "Meera", "Saxena", "FEMALE", "SLS", "Partnerships Executive", "EMPLOYEE", bd(54000), 29),
            new Emp("DEMO-E14", "Rahul", "Bhat", "MALE", "FIN", "Payroll Analyst", "EMPLOYEE", bd(51000), 27),
            new Emp("DEMO-E15", "Tara", "Fernandes", "FEMALE", "SUP", "Customer Support Specialist", "EMPLOYEE", bd(39000), 26),
    };

    private List<Employee> seedEmployees() {
        List<Employee> result = new ArrayList<>();
        for (Emp e : EMPS) {
            Employee existing = employeeRepository.findByEmployeeCode(e.code).orElse(null);
            if (existing != null) {
                result.add(existing);
                continue;
            }
            Employee emp = new Employee();
            emp.setEmployeeCode(e.code);
            emp.setFirstName(e.first);
            emp.setLastName(e.last);
            emp.setEmail(username(e.code).toLowerCase() + "@paytrack.demo");
            emp.setGender(e.gender);
            emp.setDesignation(e.designation);
            emp.setStatus("ACTIVE");
            emp.setPhone("+91 9" + String.format("%09d", Math.abs(e.code.hashCode() % 1000000000L)));
            emp.setDob(LocalDate.now().minusYears(e.age).minusDays(e.age * 7L % 300));
            emp.setJoiningDate(LocalDate.now().minusYears(Math.max(1, e.age - 22)).minusDays(e.age * 3L % 400));
            emp.setAddress("Demo address, sector " + (1 + Math.abs(e.code.hashCode() % 40)) + ", India");
            emp.setDepartment(departmentRepository.findByCode(CODE_PREFIX + e.deptCode).orElse(null));
            result.add(employeeRepository.save(emp));
        }
        log.info("Demo seeder: {} employee record(s) ready", result.size());
        return result;
    }

    private void seedAccounts(List<Employee> employees) {
        int created = 0;
        int empIndex = 1;
        for (Employee emp : employees) {
            Emp seed = null;
            for (Emp e : EMPS) {
                if (e.code.equals(emp.getEmployeeCode())) {
                    seed = e;
                    break;
                }
            }
            if (seed == null) continue;

            String username = "EMPLOYEE".equals(seed.role)
                    ? String.format("demo.emp%02d", empIndex++)
                    : username(seed.code);
            if (userService.getAllUsers().stream().anyMatch(u -> username.equals(u.getUsername()))) {
                continue;
            }
            if (emp.getDepartment() == null) continue;

            UserCreationRequest req = new UserCreationRequest();
            req.setUsername(username);
            req.setEmail(emp.getEmail());
            req.setPassword(PASSWORD);
            req.setConfirmPassword(PASSWORD);
            req.setRole("ROLE_" + seed.role);
            req.setFullName(emp.getFirstName() + " " + emp.getLastName());
            req.setDepartmentId(emp.getDepartment().getId());
            req.setEmployeeId(emp.getId());
            req.setStatus("ACTIVE");
            req.setUsername(username);

            try {
                userService.createUser(req);
                created++;
            } catch (RuntimeException ex) {
                log.warn("Demo seeder: skipped account for {} - {}", emp.getEmployeeCode(), ex.getMessage());
            }
        }
        log.info("Demo seeder: {} login account(s) created", created);

        // Link department heads to their manager employee
        List<String> headCodes = List.of("DEMO-M01", "DEMO-M02", "DEMO-M03");
        for (Department dept : departmentRepository.findAll()) {
            if (dept.getManagerId() != null) continue;
            employees.stream()
                    .filter(e -> e.getDepartment() != null && e.getDepartment().getId().equals(dept.getId()))
                    .filter(e -> headCodes.contains(e.getEmployeeCode()))
                    .findFirst()
                    .ifPresent(emp -> {
                        dept.setManagerId(emp.getId());
                        departmentRepository.save(dept);
                    });
        }
    }

    private static String username(String code) {
        return switch (code) {
            case "DEMO-M01" -> "demo.mgr.eng";
            case "DEMO-M02" -> "demo.mgr.sls";
            case "DEMO-M03" -> "demo.mgr.fin";
            case "DEMO-H01" -> "demo.hr";
            case "DEMO-A01" -> "demo.admin";
            default -> "demo." + code.toLowerCase();
        };
    }

    private void seedSalaryStructures(List<Employee> employees) {
        int created = 0;
        for (Employee emp : employees) {
            if (salaryStructureRepository.findByEmployeeId(emp.getId()).isPresent()) continue;
            Emp seed = findSeed(emp.getEmployeeCode());
            if (seed == null) continue;

            BigDecimal basic = seed.basic;
            BigDecimal hra = money(basic.multiply(new BigDecimal("0.40")));
            BigDecimal da = money(basic.multiply(new BigDecimal("0.12")));
            BigDecimal bonus = money(basic.multiply(new BigDecimal("0.08")));
            BigDecimal other = money(basic.multiply(new BigDecimal("0.06")));
            BigDecimal overtime = money(basic.multiply(new BigDecimal("0.004")));
            BigDecimal pf = money(basic.multiply(new BigDecimal("0.12")));
            BigDecimal tax = money(grossOf(basic, hra, da, bonus, other).multiply(new BigDecimal("0.06")));
            BigDecimal otherDed = money(basic.multiply(new BigDecimal("0.01")));

            BigDecimal gross = grossOf(basic, hra, da, bonus, other);
            BigDecimal deductions = money(pf.add(tax).add(otherDed));

            SalaryStructure s = new SalaryStructure();
            s.setEmployee(emp);
            s.setBasicSalary(basic);
            s.setHra(hra);
            s.setDa(da);
            s.setBonus(bonus);
            s.setOtherAllowances(other);
            s.setOvertimeRate(overtime);
            s.setPf(pf);
            s.setTax(tax);
            s.setOtherDeductions(otherDed);
            s.setGrossSalary(gross);
            s.setNetSalary(money(gross.subtract(deductions)));
            salaryStructureRepository.save(s);
            created++;
        }
        log.info("Demo seeder: {} salary structure(s) created", created);
    }

    private void seedAttendance(List<Employee> employees) {
        Random rnd = new Random(20260927L);
        LocalDate today = LocalDate.now();
        List<AttendanceRecord> batch = new ArrayList<>();

        for (Employee emp : employees) {
            for (int back = 30; back >= 0; back--) {
                LocalDate date = today.minusDays(back);
                // Weekend off: no record at all (schema has no WEEKLY_OFF status)
                DayOfWeek dow = date.getDayOfWeek();
                if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) continue;
                if (attendanceRecordRepository.findByEmployeeIdAndDate(emp.getId(), date).isPresent()) continue;

                int roll = rnd.nextInt(100);
                String status;
                String remarks;
                LocalTime in;
                LocalTime out;

                if (roll < 6) {
                    status = "ABSENT";
                    in = null;
                    out = null;
                    remarks = "Absent without intimation";
                } else if (roll < 12) {
                    status = "ON_LEAVE";
                    in = null;
                    out = null;
                    remarks = "Approved leave";
                } else if (roll < 18) {
                    status = "HALF_DAY";
                    in = LocalTime.of(9, 15);
                    out = LocalTime.of(14, 0);
                    remarks = "Half day - prior approval";
                } else if (roll < 30) {
                    status = "LATE";
                    in = LocalTime.of(9, 40 + rnd.nextInt(19));
                    out = LocalTime.of(18, 30);
                    remarks = "Late arrival";
                } else {
                    status = "PRESENT";
                    in = LocalTime.of(8, 40 + rnd.nextInt(19));
                    out = LocalTime.of(18, 0 + rnd.nextInt(50));
                    remarks = null;
                }

                AttendanceRecord rec = new AttendanceRecord();
                rec.setEmployee(emp);
                rec.setDate(date);
                rec.setStatus(status);
                rec.setCheckInTime(in);
                rec.setCheckOutTime(out);
                rec.setRemarks(remarks);
                batch.add(rec);
            }
        }

        if (!batch.isEmpty()) {
            attendanceRecordRepository.saveAll(batch);
        }
        log.info("Demo seeder: {} attendance record(s) created for last 30 days", batch.size());
    }

    private void seedPayroll(List<Employee> employees) {
        Random rnd = new Random(424242L);
        LocalDate today = LocalDate.now();
        int created = 0;
        int skipped = 0;

        for (int month = 1; month <= today.getMonthValue(); month++) {
            int year = today.getYear();
            for (Employee emp : employees) {
                if (payrollRecordRepository.existsByEmployeeIdAndMonthAndYear(emp.getId(), month, year)) {
                    skipped++;
                    continue;
                }

                PayrollProcessRequest req = new PayrollProcessRequest();
                req.setEmployeeId(emp.getId());
                req.setMonth(month);
                req.setYear(year);
                req.setOvertimeHours(BigDecimal.valueOf(rnd.nextInt(16)));
                int quarterEndBonus = month % 3 == 0 ? 5000 : 0;
                req.setAdditionalBonus(BigDecimal.valueOf(rnd.nextInt(4) * 1000 + quarterEndBonus));
                req.setPaymentMethod("BANK_TRANSFER");
                try {
                    payrollService.processPayroll(req);
                    created++;
                } catch (RuntimeException ex) {
                    skipped++;
                }
            }
        }
        log.info("Demo seeder: {} payroll record(s) generated year to date ({} skipped)", created, skipped);
    }

    private void seedLeaveBalances(List<Employee> employees) {
        int year = LocalDate.now().getYear();
        int created = 0;
        for (Employee emp : employees) {
            if (leaveBalanceRepository.findByEmployeeIdAndYear(emp.getId(), year).isPresent()) continue;
            LeaveBalance lb = new LeaveBalance();
            lb.setEmployee(emp);
            lb.setYear(year);
            lb.setCasualLeaves(12);
            lb.setSickLeaves(10);
            lb.setAnnualLeaves(15);
            lb.setUsedCasual(1 + (emp.getId().intValue() % 4));
            lb.setUsedSick(emp.getId().intValue() % 3);
            lb.setUsedAnnual(emp.getId().intValue() % 6);
            leaveBalanceRepository.save(lb);
            created++;
        }
        log.info("Demo seeder: {} leave balance row(s) created for {}", created, year);
    }

    private void seedLeaveRequests(List<Employee> employees, List<Department> departments) {
        LocalDate today = LocalDate.now();
        int created = 0;

        for (Employee emp : employees) {
            // one PENDING request per employee keeps the manager dashboard approvals list populated
            LocalDate start = today.plusDays(3 + (emp.getId().intValue() % 10));
            created += saveLeave(emp, "CASUAL", start, 1,
                    "Family function out of town.", "PENDING");

            created += saveLeave(emp, "ANNUAL", today.minusDays(40 + (emp.getId().intValue() % 30)), 3,
                    "Planned vacation with family.", "APPROVED");

            if (emp.getId().intValue() % 3 == 0) {
                created += saveLeave(emp, "SICK", today.minusDays(12), 1,
                        "Recovering from viral fever.", "REJECTED");
            }
        }
        log.info("Demo seeder: {} leave request(s) created", created);
    }

    private int saveLeave(Employee emp, String type, LocalDate start, int days,
                          String reason, String status) {
        LeaveRequest lr = new LeaveRequest();
        lr.setEmployee(emp);
        lr.setLeaveType(type);
        lr.setStartDate(start);
        lr.setEndDate(start.plusDays(days - 1L));
        lr.setTotalDays(days);
        lr.setReason(reason);
        lr.setStatus(status);
        lr.setAppliedAt(LocalDateTime.now().minusDays(emp.getId().intValue() % 20L));
        if (!"PENDING".equals(status)) {
            lr.setReviewedBy("demo.mgr");
            lr.setReviewedAt(LocalDateTime.now().minusDays(1));
            lr.setManagerRemarks("APPROVED".equals(status) ? "Approved." : "Insufficient balance.");
        }
        leaveRequestRepository.save(lr);
        return 1;
    }

    private static Emp findSeed(String code) {
        for (Emp e : EMPS) {
            if (e.code.equals(code)) return e;
        }
        return null;
    }

    private static BigDecimal grossOf(BigDecimal... parts) {
        BigDecimal sum = BigDecimal.ZERO;
        for (BigDecimal p : parts) sum = sum.add(p);
        return money(sum);
    }

    private static BigDecimal bd(long v) {
        return BigDecimal.valueOf(v);
    }

    private static BigDecimal money(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP);
    }
}
