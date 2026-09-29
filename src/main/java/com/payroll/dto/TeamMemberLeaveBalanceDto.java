package com.payroll.dto;

public class TeamMemberLeaveBalanceDto {
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private int year;

    private int casualLeaves;
    private int usedCasual;
    private int remainingCasual;

    private int sickLeaves;
    private int usedSick;
    private int remainingSick;

    private int annualLeaves;
    private int usedAnnual;
    private int remainingAnnual;

    private int totalRemaining;

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public int getCasualLeaves() { return casualLeaves; }
    public void setCasualLeaves(int casualLeaves) { this.casualLeaves = casualLeaves; }

    public int getUsedCasual() { return usedCasual; }
    public void setUsedCasual(int usedCasual) { this.usedCasual = usedCasual; }

    public int getRemainingCasual() { return remainingCasual; }
    public void setRemainingCasual(int remainingCasual) { this.remainingCasual = remainingCasual; }

    public int getSickLeaves() { return sickLeaves; }
    public void setSickLeaves(int sickLeaves) { this.sickLeaves = sickLeaves; }

    public int getUsedSick() { return usedSick; }
    public void setUsedSick(int usedSick) { this.usedSick = usedSick; }

    public int getRemainingSick() { return remainingSick; }
    public void setRemainingSick(int remainingSick) { this.remainingSick = remainingSick; }

    public int getAnnualLeaves() { return annualLeaves; }
    public void setAnnualLeaves(int annualLeaves) { this.annualLeaves = annualLeaves; }

    public int getUsedAnnual() { return usedAnnual; }
    public void setUsedAnnual(int usedAnnual) { this.usedAnnual = usedAnnual; }

    public int getRemainingAnnual() { return remainingAnnual; }
    public void setRemainingAnnual(int remainingAnnual) { this.remainingAnnual = remainingAnnual; }

    public int getTotalRemaining() { return totalRemaining; }
    public void setTotalRemaining(int totalRemaining) { this.totalRemaining = totalRemaining; }
}
