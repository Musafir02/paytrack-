package com.payroll.service;

import com.payroll.dto.PayrollProcessRequest;
import com.payroll.dto.PayrollRecordDto;
import com.payroll.exception.BadRequestException;
import com.payroll.exception.ResourceNotFoundException;
import com.payroll.model.Employee;
import com.payroll.model.PayrollRecord;
import com.payroll.model.SalaryStructure;
import com.payroll.repository.EmployeeRepository;
import com.payroll.repository.PayrollRecordRepository;
import com.payroll.repository.SalaryStructureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PayrollService {

    private static final Set<String> VALID_STATUSES = Set.of("PENDING", "PAID", "CANCELLED");

    private final PayrollRecordRepository payrollRecordRepository;
    private final EmployeeRepository employeeRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final AuditLogService auditLogService;

    public PayrollService(PayrollRecordRepository payrollRecordRepository,
                          EmployeeRepository employeeRepository,
                          SalaryStructureRepository salaryStructureRepository,
                          AuditLogService auditLogService) {
        this.payrollRecordRepository = payrollRecordRepository;
        this.employeeRepository = employeeRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.auditLogService = auditLogService;
    }

    public List<PayrollRecordDto> getAllPayrollRecords() {
        return payrollRecordRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<PayrollRecordDto> getPayrollByMonthAndYear(int month, int year) {
        return payrollRecordRepository.findByMonthAndYear(month, year).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<PayrollRecordDto> getPayrollByEmployee(Long employeeId) {
        return payrollRecordRepository.findByEmployeeIdOrderByYearDescMonthDesc(employeeId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<PayrollRecordDto> getPayrollByDepartment(Long departmentId) {
        return payrollRecordRepository.findByEmployeeDepartmentId(departmentId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public PayrollRecord getPayrollEntity(Long id) {
        return payrollRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll record not found with ID: " + id));
    }

    @Transactional
    public PayrollRecordDto processPayroll(PayrollProcessRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + request.getEmployeeId()));

        SalaryStructure structure = salaryStructureRepository.findByEmployeeId(request.getEmployeeId())
                .orElseThrow(() -> new BadRequestException(
                        "No salary structure configured for employee: " + employee.getFullName()
                                + ". Configure salary before processing payroll."));

        if (payrollRecordRepository.existsByEmployeeIdAndMonthAndYear(
                request.getEmployeeId(), request.getMonth(), request.getYear())) {
            throw new BadRequestException("Payroll for " + employee.getFullName() + " has already been processed for "
                    + monthName(request.getMonth()) + " " + request.getYear());
        }

        BigDecimal overtimeHours = safe(request.getOvertimeHours());
        BigDecimal overtimePay = money(overtimeHours.multiply(safe(structure.getOvertimeRate())));
        BigDecimal additionalBonus = money(safe(request.getAdditionalBonus()));

        BigDecimal basicSalary = money(safe(structure.getBasicSalary()));
        BigDecimal hra = money(safe(structure.getHra()));
        BigDecimal da = money(safe(structure.getDa()));
        BigDecimal bonus = money(safe(structure.getBonus()));
        BigDecimal otherAllowances = money(safe(structure.getOtherAllowances()));

        BigDecimal grossSalary = money(basicSalary.add(hra).add(da).add(bonus)
                .add(otherAllowances).add(overtimePay).add(additionalBonus));

        BigDecimal pfDeduction = money(safe(structure.getPf()));
        BigDecimal taxDeduction = money(safe(structure.getTax()));
        BigDecimal otherDeductions = money(safe(structure.getOtherDeductions())
                .add(safe(request.getAdditionalDeductions())));
        BigDecimal totalDeductions = money(pfDeduction.add(taxDeduction).add(otherDeductions));
        BigDecimal netSalary = money(grossSalary.subtract(totalDeductions));

        PayrollRecord record = new PayrollRecord();
        record.setPayrollNumber(generatePayrollNumber(request, employee));
        record.setEmployee(employee);
        record.setMonth(request.getMonth());
        record.setYear(request.getYear());
        record.setBasicSalary(basicSalary);
        record.setHra(hra);
        record.setDa(da);
        record.setBonus(bonus);
        record.setOvertimePay(overtimePay);
        record.setOtherAllowances(otherAllowances);
        record.setGrossSalary(grossSalary);
        record.setPfDeduction(pfDeduction);
        record.setTaxDeduction(taxDeduction);
        record.setOtherDeductions(otherDeductions);
        record.setTotalDeductions(totalDeductions);
        record.setNetSalary(netSalary);
        record.setPaymentStatus("PENDING");
        record.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "BANK_TRANSFER");
        record.setCreatedAt(java.time.LocalDateTime.now());

        PayrollRecord saved = payrollRecordRepository.save(record);

        auditLogService.log("PAYROLL_PROCESSED", "PAYROLL",
                "Processed payroll " + saved.getPayrollNumber() + " for " + employee.getFullName()
                        + " (" + employee.getEmployeeCode() + ") for " + monthName(request.getMonth())
                        + " " + request.getYear() + ". Gross: INR " + grossSalary + ", Net: INR " + netSalary);

        return mapToDto(saved);
    }

    @Transactional
    public PayrollRecordDto updatePaymentStatus(Long id, String status) {
        String normalised = status != null ? status.trim().toUpperCase() : "";
        if (!VALID_STATUSES.contains(normalised)) {
            throw new BadRequestException("Invalid payment status: " + status
                    + ". Allowed values are " + VALID_STATUSES);
        }

        PayrollRecord record = getPayrollEntity(id);
        record.setPaymentStatus(normalised);
        record.setPaymentDate("PAID".equals(normalised) ? LocalDate.now() : null);

        PayrollRecord saved = payrollRecordRepository.save(record);

        auditLogService.log("PAYROLL_STATUS_UPDATED", "PAYROLL",
                "Payment status for " + saved.getPayrollNumber() + " changed to " + normalised);

        return mapToDto(saved);
    }

    public PayrollRecordDto mapToDto(PayrollRecord record) {
        PayrollRecordDto dto = new PayrollRecordDto();
        dto.setId(record.getId());
        dto.setPayrollNumber(record.getPayrollNumber());
        if (record.getEmployee() != null) {
            dto.setEmployeeId(record.getEmployee().getId());
            dto.setEmployeeName(record.getEmployee().getFullName());
            dto.setEmployeeCode(record.getEmployee().getEmployeeCode());
            dto.setDesignation(record.getEmployee().getDesignation());
            if (record.getEmployee().getDepartment() != null) {
                dto.setDepartmentName(record.getEmployee().getDepartment().getName());
            }
        }
        dto.setMonth(record.getMonth());
        dto.setYear(record.getYear());
        dto.setBasicSalary(record.getBasicSalary());
        dto.setHra(record.getHra());
        dto.setDa(record.getDa());
        dto.setBonus(record.getBonus());
        dto.setOvertimePay(record.getOvertimePay());
        dto.setOtherAllowances(record.getOtherAllowances());
        dto.setGrossSalary(record.getGrossSalary());
        dto.setPfDeduction(record.getPfDeduction());
        dto.setTaxDeduction(record.getTaxDeduction());
        dto.setOtherDeductions(record.getOtherDeductions());
        dto.setTotalDeductions(record.getTotalDeductions());
        dto.setNetSalary(record.getNetSalary());
        dto.setPaymentStatus(record.getPaymentStatus());
        dto.setPaymentDate(record.getPaymentDate());
        dto.setPaymentMethod(record.getPaymentMethod());
        dto.setCreatedAt(record.getCreatedAt());
        return dto;
    }

    private String generatePayrollNumber(PayrollProcessRequest request, Employee employee) {
        String code = employee.getEmployeeCode() != null ? employee.getEmployeeCode() : String.valueOf(employee.getId());
        String candidate = String.format("PAY-%d%02d-%s", request.getYear(), request.getMonth(), code);

        String unique = candidate;
        int suffix = 1;
        while (payrollRecordRepository.findByPayrollNumber(unique).isPresent()) {
            unique = candidate + "-" + suffix++;
        }
        return unique;
    }

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private BigDecimal money(BigDecimal value) {
        return safe(value).setScale(2, RoundingMode.HALF_UP);
    }

    private String monthName(int month) {
        String[] names = {"January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"};
        return month >= 1 && month <= 12 ? names[month - 1] : String.valueOf(month);
    }
}
