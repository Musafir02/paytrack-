package com.payroll.controller;

import com.payroll.dto.ApiResponse;
import com.payroll.dto.AttendanceDto;
import com.payroll.dto.EmployeeDto;
import com.payroll.dto.PayrollRecordDto;
import com.payroll.dto.TeamMemberLeaveBalanceDto;
import com.payroll.exception.BadRequestException;
import com.payroll.exception.UnauthorizedException;
import com.payroll.model.Employee;
import com.payroll.security.CustomUserDetails;
import com.payroll.service.AttendanceService;
import com.payroll.service.EmployeeService;
import com.payroll.service.LeaveService;
import com.payroll.service.PayrollService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/manager")
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'HR')")
public class ManagerController {

    private final EmployeeService employeeService;
    private final AttendanceService attendanceService;
    private final PayrollService payrollService;
    private final LeaveService leaveService;

    public ManagerController(EmployeeService employeeService,
                             AttendanceService attendanceService,
                             PayrollService payrollService,
                             LeaveService leaveService) {
        this.employeeService = employeeService;
        this.attendanceService = attendanceService;
        this.payrollService = payrollService;
        this.leaveService = leaveService;
    }

    @GetMapping("/team")
    public ResponseEntity<ApiResponse<List<EmployeeDto>>> getTeamMembers() {
        Long deptId = getManagerDepartmentId();
        return ResponseEntity.ok(ApiResponse.ok(employeeService.getEmployeesByDepartment(deptId)));
    }

    @GetMapping("/team/attendance")
    public ResponseEntity<ApiResponse<List<AttendanceDto>>> getTeamAttendance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        Long deptId = getManagerDepartmentId();

        if (month != null || year != null) {
            int qYear = (year != null) ? year : LocalDate.now().getYear();
            int qMonth = (month != null) ? month : LocalDate.now().getMonthValue();
            if (qMonth < 1 || qMonth > 12) {
                throw new BadRequestException("Month must be between 1 and 12");
            }
            LocalDate start = LocalDate.of(qYear, qMonth, 1);
            LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
            return ResponseEntity.ok(ApiResponse.ok(attendanceService.getAttendanceByDepartmentAndRange(deptId, start, end)));
        }

        LocalDate qDate = (date != null) ? date : LocalDate.now();
        return ResponseEntity.ok(ApiResponse.ok(attendanceService.getAttendanceByDepartmentAndDate(deptId, qDate)));
    }

    @PostMapping("/team/attendance/mark")
    public ResponseEntity<ApiResponse<AttendanceDto>> markTeamAttendance(@RequestBody AttendanceDto dto) {
        Long deptId = getManagerDepartmentId();
        return ResponseEntity.ok(ApiResponse.ok(attendanceService.markTeamAttendance(deptId, dto)));
    }

    @GetMapping("/team/payroll")
    public ResponseEntity<ApiResponse<List<PayrollRecordDto>>> getTeamPayroll() {
        Long deptId = getManagerDepartmentId();
        return ResponseEntity.ok(ApiResponse.ok(payrollService.getPayrollByDepartment(deptId)));
    }

    @GetMapping("/team/leave-balances")
    public ResponseEntity<ApiResponse<List<TeamMemberLeaveBalanceDto>>> getTeamLeaveBalances(
            @RequestParam(required = false) Integer year) {
        Long deptId = getManagerDepartmentId();
        int qYear = (year != null) ? year : LocalDate.now().getYear();
        return ResponseEntity.ok(ApiResponse.ok(leaveService.getDepartmentLeaveBalances(deptId, qYear)));
    }

    private Long getManagerDepartmentId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails user = (CustomUserDetails) auth.getPrincipal();
        Employee emp = user.getEmployee();
        if (emp == null || emp.getDepartment() == null) {
            throw new UnauthorizedException("Manager is not assigned to any department");
        }
        return emp.getDepartment().getId();
    }
}
