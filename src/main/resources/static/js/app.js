// Main Application Controller
const app = {
    currentUser: null,
    departments: [],
    employees: [],
    payrollChartInstance: null,
    deptChartInstance: null,
    currentReportTab: 'payroll',

    async init() {
        this.currentUser = await auth.checkSession();
        if (!this.currentUser) return;

        this.applyRolePermissions();
        this.setupEventListeners();

        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();

        this.pollNotifications();
        setInterval(() => this.pollNotifications(), 30000);
    },

    applyRolePermissions() {
        const role = auth.getRole();
        const user = this.currentUser;

        // Populate top and sidebar user badges
        document.getElementById('sidebarUserName').textContent = user.fullName || user.username;
        document.getElementById('topUserName').textContent = user.fullName || user.username;
        const initial = (user.firstName ? user.firstName[0] : user.username[0]).toUpperCase();
        document.getElementById('sidebarAvatar').textContent = initial;
        document.getElementById('topAvatar').textContent = initial;

        const roleClean = role.replace('ROLE_', '');
        document.getElementById('sidebarUserRole').textContent = roleClean;
        document.getElementById('topUserRoleBadge').textContent = roleClean;

        // Toggle navigation groups based on role
        if (auth.isAdminOrHR()) {
            document.querySelectorAll('.role-admin-hr').forEach(el => el.classList.remove('d-none'));
            if (auth.isAdmin()) {
                document.querySelectorAll('.role-admin-only').forEach(el => el.classList.remove('d-none'));
            }
        } else if (auth.isManager()) {
            document.querySelectorAll('.role-admin-hr').forEach(el => el.classList.add('d-none'));
            document.querySelectorAll('.role-manager').forEach(el => el.classList.remove('d-none'));
        } else {
            // Employee
            document.querySelectorAll('.role-admin-hr').forEach(el => el.classList.add('d-none'));
            document.querySelectorAll('.role-reports').forEach(el => el.classList.add('d-none'));
            document.querySelectorAll('.role-employee').forEach(el => el.classList.remove('d-none'));
        }
    },

    setupEventListeners() {
        const toggleBtn = document.getElementById('sidebarToggleBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('show');
            });
        }

        // Live calculation on salary input fields
        document.querySelectorAll('.sal-calc').forEach(input => {
            input.addEventListener('input', () => this.calculateSalaryModalTotals());
        });
    },

    handleRoute() {
        const rawHash = window.location.hash || '#dashboard';
        const route = rawHash.replace('#', '');

        // Hide all views
        document.querySelectorAll('.content-view').forEach(v => v.classList.add('d-none'));
        document.querySelectorAll('#sidebar .nav-link').forEach(l => l.classList.remove('active'));

        // Route dispatcher
        let targetViewId = 'view-' + route;
        let navLinkId = 'nav-' + route;
        let pageTitle = 'Dashboard';

        if (route === 'dashboard') {
            if (auth.isManager()) {
                targetViewId = 'view-manager-dashboard';
                pageTitle = 'Manager Dashboard';
            } else if (auth.isEmployee()) {
                targetViewId = 'view-employee-dashboard';
                pageTitle = 'Employee Self-Service Portal';
            } else {
                pageTitle = 'Executive Dashboard';
            }
        } else if (route === 'manager-dashboard') {
            targetViewId = 'view-manager-dashboard';
            pageTitle = 'Manager Dashboard';
            navLinkId = 'nav-dashboard';
        } else if (route === 'employee-dashboard') {
            targetViewId = 'view-employee-dashboard';
            pageTitle = 'Employee Self-Service Portal';
            navLinkId = 'nav-dashboard';
        } else if (route === 'team') {
            targetViewId = 'view-my-team';
            pageTitle = 'My Team';
            navLinkId = 'nav-team';
        } else if (route === 'team-attendance') {
            targetViewId = 'view-attendance';
            pageTitle = 'Team Attendance';
        } else if (route === 'team-leaves') {
            targetViewId = 'view-leaves';
            pageTitle = 'Team Leave Authorizations';
        } else if (route === 'team-payroll') {
            targetViewId = 'view-payroll';
            pageTitle = 'Team Payroll Records';
        } else if (route === 'my-attendance') {
            targetViewId = 'view-my-attendance';
            pageTitle = 'My Attendance';
        } else if (route === 'my-leaves') {
            targetViewId = 'view-my-leaves';
            pageTitle = 'My Leaves';
        } else if (route === 'my-salary') {
            targetViewId = 'view-my-salary';
            pageTitle = 'My Salary Structure';
        } else if (route === 'my-payslips') {
            targetViewId = 'view-my-payslips';
            pageTitle = 'My Payslips';
        } else {
            pageTitle = route.charAt(0).toUpperCase() + route.slice(1).replace('-', ' ');
        }

        const targetView = document.getElementById(targetViewId);
        if (targetView) {
            targetView.classList.remove('d-none');
        } else {
            document.getElementById('view-dashboard').classList.remove('d-none');
        }

        const activeNav = document.getElementById(navLinkId) || document.getElementById('nav-dashboard');
        if (activeNav) activeNav.classList.add('active');

        document.getElementById('topPageTitle').textContent = pageTitle;

        // Auto close mobile drawer
        document.getElementById('sidebar').classList.remove('show');

        // Load data for view
        this.loadViewData(route);
    },

    loadViewData(route) {
        if (route === 'my-attendance') {
            this.loadMyAttendance();
        } else if (route === 'my-leaves') {
            this.loadMyLeaves();
        } else if (route === 'my-salary') {
            this.loadMySalary();
        } else if (route === 'my-payslips') {
            this.loadMyPayslips();
        } else if (route === 'team') {
            this.loadMyTeam();
        } else if (route === 'team-attendance') {
            this.loadTeamAttendanceView();
        } else if (route === 'team-leaves') {
            this.loadLeaves();
        } else if (route === 'team-payroll') {
            this.loadTeamPayrollView();
        } else if (route.includes('dashboard') || route.startsWith('team')) {
            this.loadDashboardData();
        } else if (route === 'employees') {
            this.loadEmployees();
        } else if (route === 'departments') {
            this.loadDepartments();
        } else if (route === 'salary') {
            this.loadSalaryStructures();
        } else if (route === 'payroll') {
            this.loadPayrollRecords();
        } else if (route === 'attendance') {
            this.loadAttendanceRecords();
        } else if (route === 'leaves') {
            this.loadLeaves();
        } else if (route === 'reports') {
            this.loadReports();
        } else if (route === 'profile') {
            this.loadProfile();
        } else if (route === 'users') {
            this.loadUsers();
        } else if (route === 'audit-logs') {
            this.loadAuditLogs();
        } else if (route === 'notifications') {
            this.loadFullNotifications();
        }
    },

    // 1. DASHBOARD LOADER
    async loadDashboardData() {
        try {
            const res = await api.get('/api/dashboard/stats');
            if (!res || !res.success) return;
            const data = res.data;

            if (auth.isAdminOrHR()) {
                document.getElementById('dashTotalEmployees').textContent = data.totalEmployees || 0;
                document.getElementById('dashTotalDepartments').textContent = data.totalDepartments || 0;
                document.getElementById('dashCurrentPayroll').textContent = '₹' + this.formatNumber(data.currentMonthPayroll);
                document.getElementById('dashPendingLeaves').textContent = data.pendingLeaveRequests || 0;

                this.renderDashboardAlerts(data);

                const att = data.attendanceSummary || {};
                document.getElementById('dashAttPresent').textContent = att.present || 0;
                document.getElementById('dashAttLate').textContent = att.late || 0;
                document.getElementById('dashAttAbsent').textContent = att.absent || 0;
                document.getElementById('dashAttLeave').textContent = att.leave || 0;
                const todayBadge = document.getElementById('todayDateBadge');
                if (todayBadge) todayBadge.textContent = this.todayIso();

                this.renderPayrollChart(data.chartLabels, data.chartGrossData, data.chartNetData);
                this.renderDeptChart(data.deptChartLabels, data.deptChartData);
                this.loadRecentPayrolls();

            } else if (auth.isManager()) {
                document.getElementById('mgrTeamCount').textContent = data.totalTeamMembers || 0;
                document.getElementById('mgrTeamAttRate').textContent = (data.teamAttendancePercentage || 0) + '%';
                document.getElementById('mgrPendingLeaves').textContent = data.pendingLeaveRequests || 0;
                document.getElementById('mgrTeamPayroll').textContent = '₹' + this.formatNumber(data.teamPayrollSummary);

                // Department-scoped payroll trend (served for managers by /api/dashboard/stats)
                this.renderPayrollChart(data.chartLabels, data.chartGrossData, data.chartNetData, 'mgrPayrollChart');
                this.loadPendingApprovalsSummary();

            } else {
                // Employee
                document.getElementById('empWelcomeName').textContent = 'Welcome, ' + (data.employeeName || 'Employee');
                document.getElementById('empWelcomeRole').textContent = (data.designation || '') + ' | ' + (data.departmentName || '');
                document.getElementById('empNetSalary').textContent = '₹' + this.formatNumber(data.currentNetSalary);
                document.getElementById('empGrossSalary').textContent = '₹' + this.formatNumber(data.currentGrossSalary);
                document.getElementById('empAttRate').textContent = (data.employeeAttendancePercentage || 0) + '%';
                document.getElementById('empPresentDays').textContent = data.employeePresentDays || 0;
                document.getElementById('empAbsentDays').textContent = data.employeeAbsentDays || 0;
                document.getElementById('empTotalLeaves').textContent = data.remainingLeaves || 0;
                document.getElementById('empCasualLeaves').textContent = data.casualLeavesRemaining || 0;
                document.getElementById('empSickLeaves').textContent = data.sickLeavesRemaining || 0;
                document.getElementById('empAnnualLeaves').textContent = data.annualLeavesRemaining || 0;

                if (data.latestPayslip) {
                    const ps = data.latestPayslip;
                    document.getElementById('empLatestPayslipBox').innerHTML = `
                        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
                            <div>
                                <div class="fw-bold text-navy fs-6">Pay Period: Month ${ps.month}/${ps.year}</div>
                                <div class="text-muted small">Reference: ${ps.payrollNumber} | Net Pay: <strong class="text-success">₹${this.formatNumber(ps.netSalary)}</strong></div>
                                <span class="badge ${ps.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'} mt-1">${ps.paymentStatus}</span>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-outline-primary" onclick="app.viewPayslipModal(${ps.id})"><i class="bi bi-eye me-1"></i> View</button>
                                <button class="btn btn-sm btn-primary" onclick="app.downloadPayslipPdf(${ps.id}, '${ps.payrollNumber}')"><i class="bi bi-download me-1"></i> Download PDF</button>
                            </div>
                        </div>
                    `;
                }

                this.loadEmployeeRecentLeavesAndAtt();
            }
        } catch (err) {
            console.error('Error loading dashboard stats:', err);
        }
    },

    renderDashboardAlerts(data) {
        const container = document.getElementById('dashAlertsContainer');
        if (!container) return;

        const alerts = [];
        const pendingLeaves = data.pendingLeaveRequests || 0;
        const missingSalary = data.missingSalaryCount || 0;
        const pendingPayroll = data.payrollPendingCurrentMonth || 0;
        const missingAttendance = data.missingAttendanceToday || 0;

        if (pendingLeaves > 0) {
            alerts.push(`
                <div class="d-flex align-items-center justify-content-between p-2 px-3 rounded-2 bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-clock-history fs-5 text-warning"></i>
                        <span><strong>${pendingLeaves}</strong> leave request${pendingLeaves > 1 ? 's' : ''} awaiting approval</span>
                    </div>
                    <a href="#leaves" class="btn btn-sm btn-outline-warning text-dark py-0 px-2 fw-semibold">Review</a>
                </div>
            `);
        }

        if (missingSalary > 0) {
            alerts.push(`
                <div class="d-flex align-items-center justify-content-between p-2 px-3 rounded-2 bg-danger-subtle text-danger-emphasis border border-danger-subtle">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-exclamation-triangle-fill fs-5 text-danger"></i>
                        <span><strong>${missingSalary}</strong> active employee${missingSalary > 1 ? 's' : ''} missing salary structure</span>
                    </div>
                    <a href="#salary" class="btn btn-sm btn-outline-danger py-0 px-2 fw-semibold">Configure</a>
                </div>
            `);
        }

        if (pendingPayroll > 0) {
            alerts.push(`
                <div class="d-flex align-items-center justify-content-between p-2 px-3 rounded-2 bg-info-subtle text-info-emphasis border border-info-subtle">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-calculator-fill fs-5 text-info"></i>
                        <span><strong>${pendingPayroll}</strong> employee${pendingPayroll > 1 ? 's' : ''} pending payroll processing for current month</span>
                    </div>
                    <a href="#payroll" class="btn btn-sm btn-outline-info text-dark py-0 px-2 fw-semibold">Process</a>
                </div>
            `);
        }

        if (missingAttendance > 0) {
            alerts.push(`
                <div class="d-flex align-items-center justify-content-between p-2 px-3 rounded-2 bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-calendar-x fs-5 text-secondary"></i>
                        <span><strong>${missingAttendance}</strong> active employee${missingAttendance > 1 ? 's' : ''} have not marked attendance today</span>
                    </div>
                    <a href="#attendance" class="btn btn-sm btn-outline-secondary py-0 px-2 fw-semibold">Check</a>
                </div>
            `);
        }

        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="alert alert-success d-flex align-items-center justify-content-between p-3 mb-0 border-0 rounded-3 shadow-sm bg-success-subtle text-success-emphasis">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-check-circle-fill fs-5 text-success"></i>
                        <span class="fw-semibold">All caught up! No pending payroll, leave, or attendance actions required.</span>
                    </div>
                    <span class="badge bg-success">Up to date</span>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white py-2 d-flex align-items-center gap-2">
                        <i class="bi bi-bell-fill text-warning"></i>
                        <span class="fw-bold small text-navy">Pending Actions Required (${alerts.length})</span>
                    </div>
                    <div class="card-body p-3 d-flex flex-column gap-2">
                        ${alerts.join('')}
                    </div>
                </div>
            `;
        }
    },

    renderPayrollChart(labels, grossData, netData, canvasId) {
        const id = canvasId || 'payrollChart';
        const ctx = document.getElementById(id);
        if (!ctx) return;

        this.payrollChartInstances = this.payrollChartInstances || {};
        if (this.payrollChartInstances[id]) {
            this.payrollChartInstances[id].destroy();
            this.payrollChartInstances[id] = null;
        }

        const fallbackLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chartLabels = (labels && labels.length) ? labels : fallbackLabels;
        const chartGross = (grossData && grossData.length) ? grossData : new Array(chartLabels.length).fill(0);
        const chartNet = (netData && netData.length) ? netData : new Array(chartLabels.length).fill(0);

        this.payrollChartInstances[id] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [
                    {
                        label: 'Gross Salary (₹)',
                        data: chartGross,
                        backgroundColor: '#3b82f6',
                        borderRadius: 6
                    },
                    {
                        label: 'Net Salary (₹)',
                        data: chartNet,
                        backgroundColor: '#10b981',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ` ${ctx.dataset.label}: ₹${Number(ctx.raw || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: v => '₹' + v.toLocaleString('en-IN')
                        }
                    }
                }
            }
        });
    },

    renderDeptChart(labels, data) {
        const ctx = document.getElementById('deptChart');
        if (!ctx) return;

        if (this.deptChartInstance) {
            this.deptChartInstance.destroy();
            this.deptChartInstance = null;
        }

        const hasData = data && data.length && data.some(v => v > 0);
        const chartLabels = (hasData && labels && labels.length) ? labels : ['No Staff Assigned'];
        const chartData = (hasData && data && data.length) ? data : [1];
        const colors = hasData
            ? ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1']
            : ['#cbd5e1'];

        this.deptChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartData,
                    backgroundColor: colors.slice(0, chartLabels.length),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                if (!hasData) return ' No staff assigned yet';
                                return ` ${ctx.label}: ${ctx.raw} staff`;
                            }
                        }
                    }
                }
            }
        });
    },

    async loadRecentPayrolls() {
        const tbody = document.getElementById('dashRecentPayrollsBody');
        if (!tbody) return;

        try {
            const res = await api.get('/api/payroll');
            if (!res || !res.success || !res.data || !res.data.length) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted">No recent payrolls recorded.</td></tr>';
                return;
            }

            tbody.innerHTML = res.data.slice(0, 5).map(p => `
                <tr>
                    <td class="fw-semibold text-navy">${p.payrollNumber}</td>
                    <td>${p.employeeName} <small class="text-muted">(${p.employeeCode})</small></td>
                    <td>Month ${p.month}/${p.year}</td>
                    <td class="fw-bold text-success">₹${this.formatNumber(p.netSalary)}</td>
                    <td><span class="badge ${p.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}">${p.paymentStatus}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary p-1 px-2" onclick="app.viewPayslipModal(${p.id})"><i class="bi bi-eye"></i></button>
                        <button class="btn btn-sm btn-outline-success p-1 px-2" onclick="app.downloadPayslipPdf(${p.id}, '${p.payrollNumber}')"><i class="bi bi-download"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            console.error('Error loading recent payrolls:', e);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted">No recent payrolls recorded.</td></tr>';
        }
    },

    async loadManagerTeamAndLeaves() {
        try {
            const [teamRes, leavesRes] = await Promise.all([
                api.get('/api/manager/team'),
                api.get('/api/manager/leaves')
            ]);

            const teamBody = document.getElementById('mgrTeamMembersBody');
            if (teamRes && teamRes.success && teamRes.data && teamBody) {
                teamBody.innerHTML = teamRes.data.map(m => `
                    <tr>
                        <td class="fw-semibold text-navy">${m.employeeCode}</td>
                        <td>${m.fullName}</td>
                        <td>${m.designation}</td>
                        <td>${m.email}</td>
                        <td>${m.phone || '-'}</td>
                        <td><span class="badge badge-active">${m.status}</span></td>
                    </tr>
                `).join('');
            }

            const leavesBody = document.getElementById('mgrPendingLeavesBody');
            if (leavesRes && leavesRes.success && leavesBody) {
                const pending = leavesRes.data.filter(l => l.status === 'PENDING');
                if (!pending.length) {
                    leavesBody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted">No pending leave requests from team.</td></tr>';
                } else {
                    leavesBody.innerHTML = pending.map(l => `
                        <tr>
                            <td><strong>${l.employeeName}</strong> (${l.employeeCode})</td>
                            <td><span class="badge badge-leave">${l.leaveType}</span></td>
                            <td>${l.startDate} to ${l.endDate}</td>
                            <td>${l.totalDays} days</td>
                            <td>${l.reason}</td>
                            <td>
                                <button class="btn btn-sm btn-success p-1 px-2" onclick="app.quickReviewLeave(${l.id}, 'APPROVED')"><i class="bi bi-check-lg"></i> Approve</button>
                                <button class="btn btn-sm btn-danger p-1 px-2" onclick="app.quickReviewLeave(${l.id}, 'REJECTED')"><i class="bi bi-x-lg"></i> Reject</button>
                            </td>
                        </tr>
                    `).join('');
                }
            }
        } catch (e) {
            console.error('Error loading manager data:', e);
        }
    },

    async loadPendingApprovalsSummary() {
        const body = document.getElementById('dashPendingApprovalsBody');
        if (!body) return;
        try {
            const res = await api.get('/api/manager/leaves');
            if (!res || !res.success) return;
            const pending = res.data.filter(l => l.status === 'PENDING');
            if (!pending.length) {
                body.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-muted">No pending requests from your team.</td></tr>';
                return;
            }
            body.innerHTML = pending.slice(0, 5).map(l => `
                <tr>
                    <td><strong>${this.esc(l.employeeName)}</strong><br><small class="text-muted">${this.esc(l.employeeCode || '')}</small></td>
                    <td><span class="badge badge-leave">${l.leaveType}</span></td>
                    <td>${l.startDate} to ${l.endDate}<br><small class="text-muted">${l.totalDays} day(s)</small></td>
                    <td class="text-end"><a href="#team" class="btn btn-sm btn-outline-primary py-0">Review</a></td>
                </tr>
            `).join('');
        } catch (e) {
            console.error('Error loading pending approvals:', e);
            body.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-muted">Could not load pending requests.</td></tr>';
        }
    },

    async loadMyTeam() {
        const tbody = document.getElementById('teamRosterBody');
        if (!tbody) return;

        const month = (document.getElementById('teamMonthFilter') || {}).value || '';
        const year = (document.getElementById('teamYearFilter') || {}).value || '';

        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><span class="spinner-border spinner-border-sm me-2"></span>Loading team...</td></tr>';

        let teamRes;
        try {
            const results = await Promise.all([
                api.get('/api/manager/team'),
                api.get('/api/manager/leaves'),
                api.get(`/api/manager/team/attendance?month=${month}&year=${year}`),
                api.get('/api/manager/team/payroll'),
                api.get(`/api/manager/team/leave-balances?year=${year}`)
            ]);
            teamRes = results[0];
            this.teamIdx = {
                leaves: (results[1] && results[1].success) ? results[1].data : [],
                att: (results[2] && results[2].success) ? results[2].data : [],
                pay: (results[3] && results[3].success) ? results[3].data : [],
                bal: (results[4] && results[4].success) ? results[4].data : []
            };
        } catch (e) {
            console.error('Error loading team:', e);
            const msg = (e && e.message && /department/i.test(e.message))
                ? 'You are not assigned to a department yet. Contact your administrator.'
                : 'Could not load your team. Please try again.';
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">${this.esc(msg)}</td></tr>`;
            return;
        }

        if (!teamRes || !teamRes.success) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Could not load your team.</td></tr>';
            return;
        }

        const employees = (teamRes.data || []).filter(e => e.role !== 'ROLE_ADMIN' && e.role !== 'ROLE_HR');
        const counter = document.getElementById('teamMemberCount');
        if (counter) counter.textContent = employees.length;

        this.renderTeamRoster(employees);
    },

    teamIndex(list, key) {
        const map = {};
        (list || []).forEach(r => { if (r[key] !== null && r[key] !== undefined) map[r[key]] = r; });
        return map;
    },

    renderTeamRoster(employees) {
        const tbody = document.getElementById('teamRosterBody');
        if (!tbody) return;

        if (!employees.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No team members found in your department.</td></tr>';
            return;
        }

        const idx = this.teamIdx || {};
        const attMap = this.teamIndex(idx.att, 'employeeId');
        const payMap = this.teamIndex(idx.pay, 'employeeId');
        const balMap = this.teamIndex(idx.bal, 'employeeId');

        const rows = employees.map(emp => {
            const att = attMap[emp.id];
            const pay = payMap[emp.id];
            const bal = balMap[emp.id];
            const pending = (idx.leaves || []).filter(l => l.employeeId === emp.id && l.status === 'PENDING').length;

            const attBadge = att
                ? `<span class="badge ${this.attBadgeClass(att.status)}">${att.status}</span>`
                : '<span class="badge bg-light text-muted border">No record</span>';

            return `
                <tr class="team-row" style="cursor:pointer" onclick="app.toggleTeamMember(${emp.id})">
                    <td class="fw-semibold text-navy">${this.esc(emp.employeeCode || '')}</td>
                    <td><strong>${this.esc(emp.fullName || '')}</strong></td>
                    <td class="text-muted">${this.esc(emp.designation || '-')}</td>
                    <td>${attBadge}</td>
                    <td>${pending ? `<span class="badge bg-warning text-dark">${pending}</span>` : '<span class="text-muted">-</span>'}</td>
                    <td class="fw-semibold">${pay ? '₹' + this.formatNumber(pay.netSalary) : '-'}</td>
                    <td class="text-end"><span class="bi-chevron-down team-chevron" id="teamChev-${emp.id}"></span></td>
                </tr>
                <tr class="team-detail d-none" id="teamDetail-${emp.id}">
                    <td colspan="7" class="p-0">
                        ${this.teamDetailHtml(emp, att, pay, bal, idx.leaves || [])}
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
    },

    attBadgeClass(status) {
        switch ((status || '').toUpperCase()) {
            case 'PRESENT': return 'badge-active';
            case 'LATE': return 'badge-pending';
            case 'ABSENT': return 'badge-inactive';
            case 'ON_LEAVE': return 'badge-leave';
            case 'HALF_DAY': return 'badge-halfday';
            default: return 'bg-light text-muted border';
        }
    },

    toggleTeamMember(id) {
        const row = document.getElementById('teamDetail-' + id);
        if (!row) return;
        const chev = document.getElementById('teamChev-' + id);
        row.classList.toggle('d-none');
        if (chev) chev.classList.toggle('team-chevron-open');
    },

    teamDetailHtml(emp, att, pay, bal, leaves) {
        const myLeaves = leaves.filter(l => l.employeeId === emp.id);
        const pending = myLeaves.filter(l => l.status === 'PENDING');

        // --- Profile ---
        const profile = `
            <div class="col-12 col-lg-6">
                <h6 class="fw-bold text-navy mb-2"><i class="bi bi-person-vcard me-1"></i> Profile</h6>
                <div class="row g-2 small">
                    <div class="col-6"><span class="text-muted">Email:</span><br><strong>${this.esc(emp.email || '-')}</strong></div>
                    <div class="col-6"><span class="text-muted">Phone:</span><br><strong>${this.esc(emp.phone || '-')}</strong></div>
                    <div class="col-6"><span class="text-muted">Gender:</span><br><strong>${this.esc(emp.gender || '-')}</strong></div>
                    <div class="col-6"><span class="text-muted">Date of Birth:</span><br><strong>${emp.dob || '-'}</strong></div>
                    <div class="col-6"><span class="text-muted">Joining Date:</span><br><strong>${emp.joiningDate || '-'}</strong></div>
                    <div class="col-6"><span class="text-muted">Status:</span><br><span class="badge ${emp.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}">${emp.status || '-'}</span></div>
                    <div class="col-12"><span class="text-muted">Address:</span><br><strong>${this.esc(emp.address || '-')}</strong></div>
                </div>
            </div>
            <div class="col-12 col-lg-6">
                <h6 class="fw-bold text-navy mb-2"><i class="bi bi-calendar-check me-1"></i> Attendance (selected period)</h6>
                ${att ? `
                <div class="row g-2 small mb-2">
                    <div class="col-6"><span class="text-muted">Date:</span><br><strong>${att.date}</strong></div>
                    <div class="col-6"><span class="text-muted">Status:</span><br><span class="badge ${this.attBadgeClass(att.status)}">${att.status}</span></div>
                    <div class="col-6"><span class="text-muted">Check In:</span><br><strong>${att.checkInTime || '-'}</strong></div>
                    <div class="col-6"><span class="text-muted">Check Out:</span><br><strong>${att.checkOutTime || '-'}</strong></div>
                    <div class="col-12"><span class="text-muted">Remarks:</span><br><strong>${this.esc(att.remarks || '-')}</strong></div>
                </div>` : '<p class="text-muted small mb-0 py-3">No attendance records for the selected period.</p>'}
            </div>
        `;

        // --- Payroll ---
        const payroll = pay ? `
            <div class="row g-2 small">
                <div class="col-6 col-md-4"><span class="text-muted">Period:</span><br><strong>${pay.month}/${pay.year}</strong></div>
                <div class="col-6 col-md-4"><span class="text-muted">Ref:</span><br><strong>${this.esc(pay.payrollNumber || '-')}</strong></div>
                <div class="col-6 col-md-4"><span class="text-muted">Status:</span><br><span class="badge ${pay.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}">${pay.paymentStatus || '-'}</span></div>
                <div class="col-6 col-md-4"><span class="text-muted">Basic:</span><br><strong>₹${this.formatNumber(pay.basicSalary)}</strong></div>
                <div class="col-6 col-md-4"><span class="text-muted">HRA:</span><br><strong>₹${this.formatNumber(pay.hra)}</strong></div>
                <div class="col-6 col-md-4"><span class="text-muted">DA:</span><br><strong>₹${this.formatNumber(pay.da)}</strong></div>
                <div class="col-6 col-md-4"><span class="text-muted">Bonus:</span><br><strong>₹${this.formatNumber(pay.bonus)}</strong></div>
                <div class="col-6 col-md-4"><span class="text-muted">Overtime:</span><br><strong>₹${this.formatNumber(pay.overtimePay)}</strong></div>
                <div class="col-6 col-md-4"><span class="text-muted">Other Allow.:</span><br><strong>₹${this.formatNumber(pay.otherAllowances)}</strong></div>
                <div class="col-6 col-md-4"><span class="text-muted">Gross:</span><br><strong class="text-navy">₹${this.formatNumber(pay.grossSalary)}</strong></div>
                <div class="col-6 col-md-4"><span class="text-muted">PF:</span><br><strong class="text-danger">₹${this.formatNumber(pay.pfDeduction)}</strong></div>
                <div class="col-6 col-md-4"><span class="text-muted">Tax:</span><br><strong class="text-danger">₹${this.formatNumber(pay.taxDeduction)}</strong></div>
                <div class="col-6 col-md-4"><span class="text-muted">Other Deductions:</span><br><strong class="text-danger">₹${this.formatNumber(pay.otherDeductions)}</strong></div>
                <div class="col-6 col-md-4"><span class="text-muted">Total Deductions:</span><br><strong class="text-danger">₹${this.formatNumber(pay.totalDeductions)}</strong></div>
                <div class="col-6 col-md-4"><span class="text-muted">Net Salary:</span><br><strong class="text-success">₹${this.formatNumber(pay.netSalary)}</strong></div>
            </div>`
            : '<p class="text-muted small mb-0 py-3">No payroll records available.</p>';

        // --- Leave ---
        const leaveBalance = bal ? `
            <div class="row g-2 small mb-3">
                <div class="col-4"><span class="text-muted">Casual:</span><br><strong>${bal.usedCasual}/${bal.casualLeaves}</strong> <small class="text-muted">(${bal.remainingCasual} left)</small></div>
                <div class="col-4"><span class="text-muted">Sick:</span><br><strong>${bal.usedSick}/${bal.sickLeaves}</strong> <small class="text-muted">(${bal.remainingSick} left)</small></div>
                <div class="col-4"><span class="text-muted">Annual:</span><br><strong>${bal.usedAnnual}/${bal.annualLeaves}</strong> <small class="text-muted">(${bal.remainingAnnual} left)</small></div>
            </div>` : '<p class="text-muted small">No leave balance configured for this year.</p>';

        const leaveHistory = myLeaves.length ? `
            <div class="table-responsive">
                <table class="table table-custom table-sm mb-0">
                    <thead><tr><th>Type</th><th>Period</th><th>Days</th><th>Status</th><th>Reason</th><th>Action</th></tr></thead>
                    <tbody>
                        ${myLeaves.map(l => `
                            <tr>
                                <td><span class="badge badge-leave">${l.leaveType}</span></td>
                                <td class="small">${l.startDate} to ${l.endDate}</td>
                                <td>${l.totalDays}</td>
                                <td><span class="badge ${l.status === 'APPROVED' ? 'badge-active' : (l.status === 'REJECTED' ? 'badge-inactive' : 'badge-pending')}">${l.status}</span></td>
                                <td class="small text-muted">${this.esc(l.reason || '-')}</td>
                                <td>${l.status === 'PENDING' ? `
                                    <button class="btn btn-sm btn-success p-1 px-2" onclick="app.quickReviewLeave(${l.id}, 'APPROVED')" title="Approve"><i class="bi bi-check-lg"></i></button>
                                    <button class="btn btn-sm btn-danger p-1 px-2" onclick="app.quickReviewLeave(${l.id}, 'REJECTED')" title="Reject"><i class="bi bi-x-lg"></i></button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`
            : '<p class="text-muted small mb-0">No leave requests recorded.</p>';

        return `
            <div class="p-3 bg-light-subtle">
                ${pending.length ? `<div class="alert alert-warning py-2 px-3 small"><i class="bi bi-exclamation-triangle me-1"></i> <strong>${pending.length}</strong> leave request(s) awaiting your approval.</div>` : ''}
                <div class="row g-3 mb-3">
                    ${profile}
                </div>
                <hr>
                <h6 class="fw-bold text-navy mb-2"><i class="bi bi-cash-coin me-1"></i> Payroll Breakdown</h6>
                ${payroll}
                <hr>
                <h6 class="fw-bold text-navy mb-2"><i class="bi bi-calendar2-range me-1"></i> Leave</h6>
                ${leaveBalance}
                ${leaveHistory}
            </div>
        `;
    },

    async loadEmployeeRecentLeavesAndAtt() {
        try {
            const [leavesRes, attRes] = await Promise.all([
                api.get('/api/employee/me/leaves'),
                api.get('/api/employee/me/attendance')
            ]);

            const lBody = document.getElementById('empRecentLeavesBody');
            if (leavesRes && leavesRes.success && lBody) {
                if (!leavesRes.data.length) {
                    lBody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-muted">No leave applications found.</td></tr>';
                } else {
                    lBody.innerHTML = leavesRes.data.slice(0, 5).map(l => `
                        <tr>
                            <td><span class="badge badge-leave">${l.leaveType}</span></td>
                            <td>${l.startDate} to ${l.endDate}</td>
                            <td>${l.totalDays}</td>
                            <td><span class="badge ${l.status === 'APPROVED' ? 'badge-approved' : (l.status === 'PENDING' ? 'badge-pending' : 'badge-rejected')}">${l.status}</span></td>
                        </tr>
                    `).join('');
                }
            }

            const aBody = document.getElementById('empRecentAttendanceBody');
            if (attRes && attRes.success && aBody) {
                if (!attRes.data.length) {
                    aBody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-muted">No attendance logs found.</td></tr>';
                } else {
                    aBody.innerHTML = attRes.data.slice(0, 5).map(a => `
                        <tr>
                            <td>${a.date}</td>
                            <td>${a.checkInTime || '-'}</td>
                            <td>${a.checkOutTime || '-'}</td>
                            <td><span class="badge ${a.status === 'PRESENT' ? 'badge-present' : (a.status === 'LATE' ? 'badge-late' : 'badge-absent')}">${a.status}</span></td>
                        </tr>
                    `).join('');
                }
            }
        } catch (e) {
            console.error('Error loading employee recent records:', e);
        }
    }    ,

    // ============ EMPLOYEE SELF-SERVICE LOADERS ============

    MONTH_NAMES: ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'],

    ensureYearOptions(elId, selected) {
        const el = document.getElementById(elId);
        if (!el) return;
        if (el.options.length) {
            if (selected) el.value = String(selected);
            return;
        }
        const now = new Date().getFullYear();
        let html = '';
        for (let y = now + 1; y >= now - 4; y--) {
            html += `<option value="${y}">${y}</option>`;
        }
        el.innerHTML = html;
        el.value = String(selected || now);
    },

    ensureMonthOptions(elId, selected) {
        const el = document.getElementById(elId);
        if (!el) return;
        if (el.options.length) {
            if (selected) el.value = String(selected);
            return;
        }
        el.innerHTML = this.MONTH_NAMES
            .map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');
        el.value = String(selected || (new Date().getMonth() + 1));
    },

    async loadMyAttendance() {
        this.ensureYearOptions('myAttYear');
        this.ensureMonthOptions('myAttMonth');

        const year = parseInt(document.getElementById('myAttYear').value, 10);
        const month = parseInt(document.getElementById('myAttMonth').value, 10);
        const lastDay = new Date(year, month, 0).getDate();
        const pad = n => String(n).padStart(2, '0');
        const startDate = `${year}-${pad(month)}-01`;
        const endDate = `${year}-${pad(month)}-${pad(lastDay)}`;

        const tbody = document.getElementById('myAttendanceBody');
        try {
            const [summaryRes, listRes] = await Promise.all([
                api.get(`/api/employee/me/attendance/summary?year=${year}&month=${month}`),
                api.get(`/api/employee/me/attendance?startDate=${startDate}&endDate=${endDate}`)
            ]);

            if (summaryRes && summaryRes.success) {
                const s = summaryRes.data || {};
                this.setText('myAttRate', (s.attendancePercentage || 0) + '%');
                this.setText('myAttTotalDays', s.totalDays || 0);
                this.setText('myAttPresent', s.presentDays || 0);
                this.setText('myAttLate', s.lateDays || 0);
                this.setText('myAttAbsent', s.absentDays || 0);
                this.setText('myAttLeave', s.leaveDays || 0);
            }

            const rows = (listRes && listRes.success && listRes.data) ? listRes.data : [];
            if (!tbody) return;

            if (!rows.length) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No attendance records for ${this.MONTH_NAMES[month - 1]} ${year}.</td></tr>`;
            } else {
                tbody.innerHTML = rows.map(a => `
                    <tr>
                        <td>${a.date}</td>
                        <td>${a.checkInTime || '-'}</td>
                        <td>${a.checkOutTime || '-'}</td>
                        <td>${this.attendanceBadge(a.status)}</td>
                        <td>${this.esc(a.remarks || '-')}</td>
                    </tr>
                `).join('');
            }

            this.syncCheckInOutButtons(rows);
        } catch (e) {
            console.error('Error loading my attendance:', e);
            if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">${this.esc(e.message)}</td></tr>`;
        }
    },

    resetMyAttendancePeriod() {
        const now = new Date();
        const yearEl = document.getElementById('myAttYear');
        const monthEl = document.getElementById('myAttMonth');
        if (yearEl) yearEl.value = String(now.getFullYear());
        if (monthEl) monthEl.value = String(now.getMonth() + 1);
        return this.loadMyAttendance();
    },

    syncCheckInOutButtons(rows) {
        const today = new Date();
        const pad = n => String(n).padStart(2, '0');
        const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
        const todayRec = (rows || []).find(r => r.date === todayStr);

        const inBtn = document.getElementById('myAttCheckInBtn');
        const outBtn = document.getElementById('myAttCheckOutBtn');
        if (inBtn) inBtn.disabled = !!(todayRec && todayRec.checkInTime);
        if (outBtn) {
            outBtn.disabled = !todayRec || !todayRec.checkInTime || !!todayRec.checkOutTime;
        }
    },

    async loadMyLeaves() {
        this.ensureYearOptions('myLeaveBalanceYear');
        const year = parseInt(document.getElementById('myLeaveBalanceYear').value, 10);

        const tbody = document.getElementById('myLeavesBody');
        try {
            const [balanceRes, listRes] = await Promise.all([
                api.get(`/api/employee/me/leaves/balance?year=${year}`),
                api.get('/api/employee/me/leaves')
            ]);

            if (balanceRes && balanceRes.success) {
                const b = balanceRes.data || {};
                this.setText('myBalCasual', b.remainingCasual || 0);
                this.setText('myBalCasualUsed', b.usedCasual || 0);
                this.setText('myBalCasualTotal', b.casualLeaves || 0);
                this.setText('myBalSick', b.remainingSick || 0);
                this.setText('myBalSickUsed', b.usedSick || 0);
                this.setText('myBalSickTotal', b.sickLeaves || 0);
                this.setText('myBalAnnual', b.remainingAnnual || 0);
                this.setText('myBalAnnualUsed', b.usedAnnual || 0);
                this.setText('myBalAnnualTotal', b.annualLeaves || 0);
                this.setText('myBalTotal', b.totalRemaining || 0);
                this.setText('myBalYearLabel', b.year || year);
            }

            const rows = (listRes && listRes.success && listRes.data) ? listRes.data : [];
            this.setText('myLeaveCount', rows.length + (rows.length === 1 ? ' application' : ' applications'));
            if (!tbody) return;

            if (!rows.length) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">You have not applied for any leave yet.</td></tr>';
            } else {
                tbody.innerHTML = rows.map(l => `
                    <tr>
                        <td><span class="badge badge-leave">${this.esc(l.leaveType)}</span></td>
                        <td>${l.startDate} to ${l.endDate}</td>
                        <td><strong>${l.totalDays}</strong></td>
                        <td>${this.esc(l.reason || '-')}</td>
                        <td>${this.leaveStatusBadge(l.status)}</td>
                        <td>${this.esc(l.managerRemarks || (l.reviewedBy ? 'by ' + l.reviewedBy : '-'))}</td>
                    </tr>
                `).join('');
            }
        } catch (e) {
            console.error('Error loading my leaves:', e);
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">${this.esc(e.message)}</td></tr>`;
        }
    },

    async loadMySalary() {
        const earningsBody = document.getElementById('mySalaryEarningsBody');
        const deductionsBody = document.getElementById('mySalaryDeductionsBody');
        const historyBody = document.getElementById('mySalaryHistoryBody');

        try {
            const [salaryRes, historyRes] = await Promise.all([
                api.get('/api/salaries/me'),
                api.get('/api/salaries/me/history')
            ]);

            if (salaryRes && salaryRes.success) {
                const s = salaryRes.data || {};
                const identity = [s.designation, s.departmentName].filter(Boolean).join(' | ');
                this.setText('mySalaryIdentity',
                    [s.employeeName, s.employeeCode ? '(' + s.employeeCode + ')' : '', identity].filter(Boolean).join(' '));

                if (earningsBody) {
                    earningsBody.innerHTML = [
                        ['Basic Salary', s.basicSalary],
                        ['House Rent Allowance (HRA)', s.hra],
                        ['Dearness Allowance (DA)', s.da],
                        ['Bonus', s.bonus],
                        ['Other Allowances', s.otherAllowances]
                    ].map(([label, value]) => `
                        <tr>
                            <td>${label}</td>
                            <td class="text-end">₹${this.formatNumber(value)}</td>
                        </tr>
                    `).join('');
                }

                if (deductionsBody) {
                    deductionsBody.innerHTML = [
                        ['Provident Fund (PF)', s.pf],
                        ['Income Tax (TDS)', s.tax],
                        ['Other Deductions', s.otherDeductions]
                    ].map(([label, value]) => `
                        <tr>
                            <td>${label}</td>
                            <td class="text-end text-danger">₹${this.formatNumber(value)}</td>
                        </tr>
                    `).join('');
                }

                this.setMoney('mySalaryGross', s.grossSalary);
                this.setMoney('mySalaryTotalDeductions', s.totalDeductions);
                this.setMoney('mySalaryGrossCard', s.grossSalary);
                this.setMoney('mySalaryNetCard', s.netSalary);
                this.setMoney('mySalaryOvertime', s.overtimeRate);
            }

            const history = (historyRes && historyRes.success && historyRes.data) ? historyRes.data : [];
            if (historyBody) {
                if (!history.length) {
                    historyBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No salary revisions recorded yet.</td></tr>';
                } else {
                    historyBody.innerHTML = history.map(h => `
                        <tr>
                            <td>${h.effectiveDate || '-'}</td>
                            <td>₹${this.formatNumber(h.previousBasicSalary)} &rarr; <strong>₹${this.formatNumber(h.newBasicSalary)}</strong></td>
                            <td>₹${this.formatNumber(h.previousGrossSalary)} &rarr; <strong>₹${this.formatNumber(h.newGrossSalary)}</strong></td>
                            <td><strong>₹${this.formatNumber(h.newNetSalary)}</strong></td>
                            <td>${this.esc(h.reason || '-')}</td>
                            <td>${this.esc(h.updatedBy || '-')}</td>
                        </tr>
                    `).join('');
                }
            }

            const latest = history[0];
            this.setText('mySalaryEffectiveBadge',
                latest && latest.effectiveDate ? 'Last revised: ' + latest.effectiveDate : 'No revisions yet');
        } catch (e) {
            console.error('Error loading my salary:', e);
            if (earningsBody) earningsBody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-danger">${this.esc(e.message)}</td></tr>`;
            if (deductionsBody) deductionsBody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-danger">${this.esc(e.message)}</td></tr>`;
            if (historyBody) historyBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">${this.esc(e.message)}</td></tr>`;
        }
    },

    async loadMyPayslips() {
        const tbody = document.getElementById('myPayslipsBody');
        try {
            const res = await api.get('/api/payroll/me');
            const rows = (res && res.success && res.data) ? res.data : [];

            this.setText('myPayslipCount', rows.length);
            if (rows.length) {
                this.setMoney('myPayslipLatestNet', rows[0].netSalary);
                this.setText('myPayslipLatestPeriod',
                    `${this.MONTH_NAMES[rows[0].month - 1] || rows[0].month} ${rows[0].year}`);
                const total = rows.reduce((sum, p) => sum + (parseFloat(p.netSalary) || 0), 0);
                this.setMoney('myPayslipTotalNet', total);
            } else {
                this.setMoney('myPayslipLatestNet', 0);
                this.setText('myPayslipLatestPeriod', 'No payslip yet');
                this.setMoney('myPayslipTotalNet', 0);
            }

            if (!tbody) return;

            if (!rows.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No payslips have been generated for you yet.</td></tr>';
            } else {
                tbody.innerHTML = rows.map(p => `
                    <tr>
                        <td>${this.MONTH_NAMES[p.month - 1] || p.month} ${p.year}</td>
                        <td><small class="text-muted">${this.esc(p.payrollNumber)}</small></td>
                        <td>₹${this.formatNumber(p.grossSalary)}</td>
                        <td class="text-danger">₹${this.formatNumber(p.totalDeductions)}</td>
                        <td><strong class="text-success">₹${this.formatNumber(p.netSalary)}</strong></td>
                        <td><span class="badge ${p.paymentStatus === 'PAID' ? 'badge-paid' : (p.paymentStatus === 'CANCELLED' ? 'badge-cancelled' : 'badge-pending')}">${this.esc(p.paymentStatus)}</span></td>
                        <td class="text-end text-nowrap">
                            <button class="btn btn-sm btn-outline-primary p-1 px-2 me-1" onclick="app.viewPayslipModal(${p.id})" title="View Payslip"><i class="bi bi-eye"></i></button>
                            <button class="btn btn-sm btn-outline-success p-1 px-2" onclick="app.downloadPayslipPdf(${p.id})" title="Download PDF"><i class="bi bi-download"></i></button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (e) {
            console.error('Error loading my payslips:', e);
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">${this.esc(e.message)}</td></tr>`;
        }
    },

    refreshEmployeeSelfService() {
        const route = (window.location.hash || '#dashboard').replace('#', '');
        if (route === 'my-attendance') return this.loadMyAttendance();
        if (route === 'my-leaves') return this.loadMyLeaves();
        if (route === 'my-salary') return this.loadMySalary();
        if (route === 'my-payslips') return this.loadMyPayslips();
        return this.loadDashboardData();
    },

    attendanceBadge(status) {
        const map = {
            'PRESENT': 'badge-present',
            'LATE': 'badge-late',
            'ABSENT': 'badge-absent',
            'ON_LEAVE': 'badge-leave',
            'HALF_DAY': 'badge-late'
        };
        return `<span class="badge ${map[status] || 'badge-pending'}">${this.esc(status || 'UNKNOWN')}</span>`;
    },

    leaveStatusBadge(status) {
        const map = {
            'APPROVED': 'badge-approved',
            'PENDING': 'badge-pending',
            'REJECTED': 'badge-rejected',
            'CANCELLED': 'badge-cancelled'
        };
        return `<span class="badge ${map[status] || 'badge-pending'}">${this.esc(status || 'UNKNOWN')}</span>`;
    },

    // 2. EMPLOYEE MANAGEMENT
    async loadEmployees() {
        try {
            await this.loadDepartmentsList();
            const res = await api.get('/api/employees');
            if (res && res.success) {
                this.employees = res.data;
                this.renderEmployeesTable(this.employees);
            }
        } catch (e) {
            console.error('Error loading employees:', e);
            showToast('Failed to load employees', 'error');
        }
    },

    async loadDepartmentsList() {
        try {
            const res = await api.get('/api/departments');
            if (res && res.success) {
                this.departments = res.data;
                const deptFilter = document.getElementById('empDeptFilter');
                if (deptFilter) {
                    deptFilter.innerHTML = '<option value="">All Departments</option>' +
                        this.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
                }
                const attDeptFilter = document.getElementById('attendanceDeptFilter');
                if (attDeptFilter) {
                    attDeptFilter.innerHTML = '<option value="">All Departments</option>' +
                        this.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
                }
                const modalDept = document.getElementById('empModalDept');
                if (modalDept) {
                    modalDept.innerHTML = this.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
                }
            }
        } catch (e) {
            console.error('Error loading departments list:', e);
        }
    },

    async ensureDepartmentsLoaded() {
        if (!this.departments || !this.departments.length) {
            try {
                const res = await api.get('/api/departments');
                if (res && res.success) this.departments = res.data;
            } catch (e) {
                console.error('Failed to load departments:', e);
            }
        }
        return this.departments || [];
    },

    async populateDeptSelect(selectId, selectedId = null) {
        const sel = document.getElementById(selectId);
        if (!sel) return;
        const depts = await this.ensureDepartmentsLoaded();
        if (!depts.length) {
            sel.innerHTML = '<option value="">No departments available</option>';
            return;
        }
        sel.innerHTML = '<option value="">-- Select Department --</option>' +
            depts.map(d => `<option value="${d.id}">${d.name} (${d.code})</option>`).join('');
        sel.value = (selectedId === null || selectedId === undefined || selectedId === '') ? '' : selectedId;
    },

    renderEmployeesTable(list) {
        const tbody = document.getElementById('employeesTableBody');
        if (!tbody) return;

        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No employees found.</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(e => `
            <tr>
                <td class="fw-bold text-navy">${e.employeeCode}</td>
                <td><strong>${e.fullName}</strong></td>
                <td><span class="badge bg-light text-dark border">${e.departmentName || '-'}</span></td>
                <td>${e.designation}</td>
                <td>${e.email}</td>
                <td>${e.joiningDate}</td>
                <td><span class="badge ${e.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}">${e.status}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-info p-1 px-2" onclick="app.viewEmployeeDetails(${e.id})" title="View Details"><i class="bi bi-eye"></i></button>
                    <button class="btn btn-sm btn-outline-primary p-1 px-2 ms-1" onclick="app.editEmployee(${e.id})" title="Edit"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger p-1 px-2 ms-1" onclick="app.deactivateEmployee(${e.id})" title="Deactivate"><i class="bi bi-person-x"></i></button>
                </td>
            </tr>
        `).join('');
    },

    filterEmployees() {
        const kw = (document.getElementById('empSearchInput').value || '').toLowerCase();
        const deptId = document.getElementById('empDeptFilter').value;
        const status = document.getElementById('empStatusFilter').value;

        const filtered = this.employees.filter(e => {
            const matchesKw = !kw ||
                e.fullName.toLowerCase().includes(kw) ||
                e.employeeCode.toLowerCase().includes(kw) ||
                e.email.toLowerCase().includes(kw) ||
                e.designation.toLowerCase().includes(kw);
            const matchesDept = !deptId || (e.departmentId && String(e.departmentId) === String(deptId));
            const matchesStatus = !status || e.status === status;
            return matchesKw && matchesDept && matchesStatus;
        });

        this.renderEmployeesTable(filtered);
    },

    resetEmployeeFilters() {
        document.getElementById('empSearchInput').value = '';
        document.getElementById('empDeptFilter').value = '';
        document.getElementById('empStatusFilter').value = '';
        this.renderEmployeesTable(this.employees);
    },

    async showAddEmployeeModal() {
        document.getElementById('employeeModalTitle').textContent = 'Add New Employee';
        document.getElementById('employeeForm').reset();
        document.getElementById('empModalId').value = '';
        document.getElementById('empModalCode').readOnly = false;
        document.getElementById('empModalJoining').value = new Date().toISOString().slice(0, 10);

        // Dashboard can open this modal before the Employees list has loaded departments
        await this.populateDeptSelect('empModalDept');

        // Reset and display account creation section
        const accContainer = document.getElementById('empModalAccountContainer');
        if (accContainer) accContainer.classList.remove('d-none');
        const chk = document.getElementById('empModalCreateAccount');
        if (chk) chk.checked = true;
        const fields = document.getElementById('empModalAccountFields');
        if (fields) fields.classList.remove('d-none');
        document.getElementById('empModalUsername').value = '';
        document.getElementById('empModalPassword').value = '';
        document.getElementById('empModalRole').value = 'ROLE_EMPLOYEE';
        document.getElementById('empModalBasicSalary').value = '';

        new bootstrap.Modal(document.getElementById('employeeModal')).show();
    },

    async editEmployee(id) {
        try {
            const res = await api.get(`/api/employees/${id}`);
            if (!res || !res.success) return;
            const e = res.data;

            document.getElementById('employeeModalTitle').textContent = 'Edit Employee: ' + e.fullName;
            document.getElementById('empModalId').value = e.id;
            document.getElementById('empModalCode').value = e.employeeCode;
            document.getElementById('empModalCode').readOnly = true;
            document.getElementById('empModalFirst').value = e.firstName;
            document.getElementById('empModalLast').value = e.lastName;
            document.getElementById('empModalEmail').value = e.email;
            document.getElementById('empModalPhone').value = e.phone || '';
            document.getElementById('empModalGender').value = e.gender || 'Male';
            document.getElementById('empModalDob').value = e.dob || '';
            document.getElementById('empModalJoining').value = e.joiningDate;
            await this.populateDeptSelect('empModalDept', e.departmentId);
            document.getElementById('empModalDesignation').value = e.designation;
            document.getElementById('empModalAddress').value = e.address || '';
            document.getElementById('empModalStatus').value = e.status;

            // Hide account creation fields when editing existing personnel
            const accContainer = document.getElementById('empModalAccountContainer');
            if (accContainer) accContainer.classList.add('d-none');
            const chk = document.getElementById('empModalCreateAccount');
            if (chk) chk.checked = false;

            new bootstrap.Modal(document.getElementById('employeeModal')).show();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async saveEmployee(e) {
        e.preventDefault();
        const id = document.getElementById('empModalId').value;
        const createAcc = document.getElementById('empModalCreateAccount') ? document.getElementById('empModalCreateAccount').checked : false;
        const basicSal = document.getElementById('empModalBasicSalary') ? parseFloat(document.getElementById('empModalBasicSalary').value) || null : null;

        const payload = {
            employeeCode: document.getElementById('empModalCode').value.trim(),
            firstName: document.getElementById('empModalFirst').value.trim(),
            lastName: document.getElementById('empModalLast').value.trim(),
            email: document.getElementById('empModalEmail').value.trim(),
            phone: document.getElementById('empModalPhone').value.trim(),
            gender: document.getElementById('empModalGender').value,
            dob: document.getElementById('empModalDob').value || null,
            joiningDate: document.getElementById('empModalJoining').value,
            departmentId: parseInt(document.getElementById('empModalDept').value),
            designation: document.getElementById('empModalDesignation').value.trim(),
            address: document.getElementById('empModalAddress').value.trim(),
            status: document.getElementById('empModalStatus').value
        };

        if (!id) {
            payload.createAccount = createAcc;
            payload.basicSalary = basicSal;
            if (createAcc) {
                payload.username = document.getElementById('empModalUsername').value.trim();
                payload.password = document.getElementById('empModalPassword').value;
                payload.role = document.getElementById('empModalRole').value;
            }
        }

        try {
            let res;
            if (id) {
                res = await api.put(`/api/employees/${id}`, payload);
            } else {
                res = await api.post('/api/employees', payload);
            }

            if (res && res.success) {
                showToast(res.message, 'success');
                bootstrap.Modal.getInstance(document.getElementById('employeeModal')).hide();
                this.loadEmployees();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async viewEmployeeDetails(id) {
        try {
            const res = await api.get(`/api/employees/${id}`);
            if (!res || !res.success) return;
            const e = res.data;

            document.getElementById('empDetailsBody').innerHTML = `
                <div class="text-center mb-3">
                    <div class="avatar-circle mx-auto mb-2" style="width: 56px; height: 56px; font-size: 22px;">${e.firstName[0]}</div>
                    <h5 class="fw-bold text-navy m-0">${e.fullName}</h5>
                    <div class="text-muted small">${e.designation} &bull; ${e.departmentName || '-'}</div>
                    <span class="badge ${e.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'} mt-1">${e.status}</span>
                </div>
                <div class="list-group list-group-flush small">
                    <div class="list-group-item d-flex justify-content-between px-0"><span>Code:</span> <strong>${e.employeeCode}</strong></div>
                    <div class="list-group-item d-flex justify-content-between px-0"><span>Email:</span> <strong>${e.email}</strong></div>
                    <div class="list-group-item d-flex justify-content-between px-0"><span>Phone:</span> <strong>${e.phone || '-'}</strong></div>
                    <div class="list-group-item d-flex justify-content-between px-0"><span>Gender:</span> <strong>${e.gender || '-'}</strong></div>
                    <div class="list-group-item d-flex justify-content-between px-0"><span>Joining Date:</span> <strong>${e.joiningDate}</strong></div>
                    <div class="list-group-item d-flex justify-content-between px-0"><span>Address:</span> <span>${e.address || '-'}</span></div>
                </div>
            `;
            new bootstrap.Modal(document.getElementById('employeeDetailsModal')).show();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async deactivateEmployee(id) {
        if (!confirm('Are you sure you want to deactivate this employee?')) return;
        try {
            const res = await api.delete(`/api/employees/${id}`);
            if (res && res.success) {
                showToast(res.message, 'success');
                this.loadEmployees();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    // 3. DEPARTMENT MANAGEMENT
    async loadDepartments() {
        try {
            const res = await api.get('/api/departments');
            const tbody = document.getElementById('departmentsTableBody');
            if (!tbody) return;

            if (!res || !res.success || !res.data.length) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No departments found.</td></tr>';
                return;
            }

            this.departments = res.data;
            tbody.innerHTML = res.data.map(d => `
                <tr>
                    <td class="fw-bold text-navy">${d.code}</td>
                    <td><strong>${d.name}</strong></td>
                    <td>${d.managerName || '<span class="text-muted">None</span>'}</td>
                    <td><span class="badge bg-primary-subtle text-primary">${d.employeeCount} staff</span></td>
                    <td><small class="text-muted">${d.description || '-'}</small></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary p-1 px-2" onclick="app.editDepartment(${d.id})"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger p-1 px-2 ms-1" onclick="app.deleteDepartment(${d.id})"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            console.error('Error loading departments:', e);
        }
    },

    async showAddDepartmentModal() {
        document.getElementById('deptModalTitle').textContent = 'Add Department';
        document.getElementById('deptForm').reset();
        document.getElementById('deptModalId').value = '';
        await this.populateDeptManagerDropdown();
        new bootstrap.Modal(document.getElementById('departmentModal')).show();
    },

    async populateDeptManagerDropdown(selectedId = null) {
        try {
            const res = await api.get('/api/employees');
            const sel = document.getElementById('deptModalManager');
            if (!sel || !res || !res.success) return;

            sel.innerHTML = '<option value="">-- No Manager Assigned --</option>' +
                res.data.map(e => `<option value="${e.id}" ${selectedId && selectedId === e.id ? 'selected' : ''}>${e.fullName} (${e.employeeCode})</option>`).join('');
        } catch (e) {
            console.error('Error populating managers:', e);
        }
    },

    async editDepartment(id) {
        try {
            const res = await api.get(`/api/departments/${id}`);
            if (!res || !res.success) return;
            const d = res.data;

            document.getElementById('deptModalTitle').textContent = 'Edit Department: ' + d.name;
            document.getElementById('deptModalId').value = d.id;
            document.getElementById('deptModalCode').value = d.code;
            document.getElementById('deptModalName').value = d.name;
            document.getElementById('deptModalDesc').value = d.description || '';
            await this.populateDeptManagerDropdown(d.managerId);

            new bootstrap.Modal(document.getElementById('departmentModal')).show();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async saveDepartment(e) {
        e.preventDefault();
        const id = document.getElementById('deptModalId').value;
        const mgrVal = document.getElementById('deptModalManager').value;
        const payload = {
            code: document.getElementById('deptModalCode').value.trim(),
            name: document.getElementById('deptModalName').value.trim(),
            managerId: mgrVal ? parseInt(mgrVal) : null,
            description: document.getElementById('deptModalDesc').value.trim()
        };

        try {
            let res;
            if (id) {
                res = await api.put(`/api/departments/${id}`, payload);
            } else {
                res = await api.post('/api/departments', payload);
            }

            if (res && res.success) {
                showToast(res.message, 'success');
                bootstrap.Modal.getInstance(document.getElementById('departmentModal')).hide();
                this.loadDepartments();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async deleteDepartment(id) {
        if (!confirm('Are you sure you want to delete this department?')) return;
        try {
            const res = await api.delete(`/api/departments/${id}`);
            if (res && res.success) {
                showToast(res.message, 'success');
                this.loadDepartments();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    }    ,
    // 4. SALARY STRUCTURE MANAGEMENT
    async loadSalaryStructures() {
        try {
            const res = await api.get('/api/salaries');
            const tbody = document.getElementById('salariesTableBody');
            if (!tbody) return;

            if (!res || !res.success || !res.data.length) {
                tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted">No salary structures configured yet.</td></tr>';
                return;
            }

            tbody.innerHTML = res.data.map(s => {
                const escapedName = (s.employeeName || '').replace(/'/g, "\\'");
                return `
                <tr>
                    <td><strong>${s.employeeName}</strong> <small class="text-muted">(${s.employeeCode})</small></td>
                    <td>${s.departmentName || '-'}</td>
                    <td>₹${this.formatNumber(s.basicSalary)}</td>
                    <td>₹${this.formatNumber(s.hra)}</td>
                    <td>₹${this.formatNumber(s.da)}</td>
                    <td>₹${this.formatNumber(s.pf)}</td>
                    <td>₹${this.formatNumber(s.tax)}</td>
                    <td class="fw-semibold text-primary">₹${this.formatNumber(s.grossSalary)}</td>
                    <td class="fw-bold text-success">₹${this.formatNumber(s.netSalary)}</td>
                    <td class="text-end text-nowrap">
                        <button class="btn btn-sm btn-outline-secondary me-1" onclick="app.viewSalaryHistory(${s.employeeId}, '${escapedName}')" title="Revision History">
                            <i class="bi bi-clock-history"></i> History
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="app.showSalaryModal(${s.employeeId}, '${escapedName}')">
                            <i class="bi bi-pencil-square me-1"></i> Configure
                        </button>
                    </td>
                </tr>
                `;
            }).join('');
        } catch (e) {
            console.error('Error loading salaries:', e);
            const tbody = document.getElementById('salariesTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted">No salary structures configured yet.</td></tr>';
        }
    },

    async showSalaryModal(empId, empName) {
        try {
            const res = await api.get(`/api/salaries/employee/${empId}`);
            if (!res || !res.success) return;
            const s = res.data;

            document.getElementById('salaryModalEmpName').textContent = empName || s.employeeName;
            document.getElementById('salaryEmpId').value = s.employeeId;
            document.getElementById('salBasic').value = s.basicSalary;
            document.getElementById('salHra').value = s.hra;
            document.getElementById('salDa').value = s.da;
            document.getElementById('salBonus').value = s.bonus;
            document.getElementById('salOtRate').value = s.overtimeRate;
            document.getElementById('salAllowances').value = s.otherAllowances;
            document.getElementById('salPf').value = s.pf;
            document.getElementById('salTax').value = s.tax;
            document.getElementById('salOtherDed').value = s.otherDeductions;
            const reasonInput = document.getElementById('salReason');
            if (reasonInput) reasonInput.value = '';

            this.calculateSalaryModalTotals();
            new bootstrap.Modal(document.getElementById('salaryModal')).show();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    calculateSalaryModalTotals() {
        const val = id => parseFloat(document.getElementById(id).value) || 0;
        const earnings = val('salBasic') + val('salHra') + val('salDa') + val('salBonus') + val('salAllowances');
        const deductions = val('salPf') + val('salTax') + val('salOtherDed');
        const net = earnings - deductions;

        document.getElementById('salGrossCalc').textContent = '₹' + this.formatNumber(earnings);
        document.getElementById('salDedCalc').textContent = '- ₹' + this.formatNumber(deductions);
        document.getElementById('salNetCalc').textContent = '₹' + this.formatNumber(net);
    },

    async saveSalaryStructure(e) {
        e.preventDefault();
        const val = id => parseFloat(document.getElementById(id).value) || 0;
        const reasonInput = document.getElementById('salReason');
        const payload = {
            employeeId: parseInt(document.getElementById('salaryEmpId').value),
            basicSalary: val('salBasic'),
            hra: val('salHra'),
            da: val('salDa'),
            bonus: val('salBonus'),
            overtimeRate: val('salOtRate'),
            otherAllowances: val('salAllowances'),
            pf: val('salPf'),
            tax: val('salTax'),
            otherDeductions: val('salOtherDed'),
            reason: reasonInput ? reasonInput.value.trim() : ''
        };

        try {
            const res = await api.post('/api/salaries', payload);
            if (res && res.success) {
                showToast('Salary structure updated successfully', 'success');
                bootstrap.Modal.getInstance(document.getElementById('salaryModal')).hide();
                this.loadSalaryStructures();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async viewSalaryHistory(empId, empName) {
        try {
            const res = await api.get(`/api/salaries/employee/${empId}/history`);
            const tbody = document.getElementById('salaryHistoryTableBody');
            const titleSpan = document.getElementById('salaryHistoryEmpName');
            if (titleSpan) titleSpan.textContent = empName || '';
            if (!tbody) return;

            if (!res || !res.success || !res.data || !res.data.length) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No salary revisions recorded for this employee yet.</td></tr>';
            } else {
                tbody.innerHTML = res.data.map(h => `
                    <tr>
                        <td class="fw-semibold">${h.effectiveDate || '-'}</td>
                        <td class="text-muted">₹${this.formatNumber(h.previousGrossSalary)}</td>
                        <td class="fw-semibold text-primary">₹${this.formatNumber(h.newGrossSalary)}</td>
                        <td class="fw-bold text-success">₹${this.formatNumber(h.newNetSalary)}</td>
                        <td><span class="badge bg-light text-dark border">${h.reason || 'Salary revision'}</span></td>
                        <td><small class="text-muted">${h.updatedBy || 'System'}</small></td>
                    </tr>
                `).join('');
            }
            new bootstrap.Modal(document.getElementById('salaryHistoryModal')).show();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    // 5. PAYROLL PROCESSING
    async loadPayrollRecords() {
        try {
            const month = document.getElementById('payrollMonthFilter').value;
            const year = document.getElementById('payrollYearFilter').value;
            const res = await api.get(`/api/payroll?month=${month}&year=${year}`);
            const tbody = document.getElementById('payrollTableBody');
            if (!tbody) return;

            if (!res || !res.success || !res.data.length) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No payroll records for Month ${month}/${year}. Click "Process Payroll" to run calculations.</td></tr>`;
                return;
            }

            tbody.innerHTML = res.data.map(p => `
                <tr>
                    <td class="fw-bold text-navy">${p.payrollNumber}</td>
                    <td><strong>${p.employeeName}</strong> <small class="text-muted">(${p.employeeCode})</small></td>
                    <td>${p.month}/${p.year}</td>
                    <td>₹${this.formatNumber(p.grossSalary)}</td>
                    <td class="text-danger">- ₹${this.formatNumber(p.totalDeductions)}</td>
                    <td class="fw-bold text-success">₹${this.formatNumber(p.netSalary)}</td>
                    <td><span class="badge ${p.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}">${p.paymentStatus}</span></td>
                    <td class="text-end">
                        ${p.paymentStatus !== 'PAID' ? `<button class="btn btn-sm btn-success p-1 px-2" onclick="app.markPayrollPaid(${p.id})" title="Mark as Paid"><i class="bi bi-cash-check"></i> Disburse</button>` : ''}
                        <button class="btn btn-sm btn-outline-primary p-1 px-2 ms-1" onclick="app.viewPayslipModal(${p.id})" title="View Payslip"><i class="bi bi-eye"></i></button>
                        <button class="btn btn-sm btn-outline-success p-1 px-2 ms-1" onclick="app.downloadPayslipPdf(${p.id}, '${p.payrollNumber}')" title="Download PDF"><i class="bi bi-download"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            console.error('Error loading payroll records:', e);
            const tbody = document.getElementById('payrollTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No payroll records found for this period.</td></tr>';
        }
    },

    async showProcessPayrollModal() {
        try {
            const res = await api.get('/api/employees');
            if (!res || !res.success) return;

            const sel = document.getElementById('procEmpSelect');
            sel.innerHTML = '<option value="">-- Select Employee --</option>' +
                res.data.filter(e => e.status === 'ACTIVE').map(e => `<option value="${e.id}">${e.fullName} (${e.employeeCode}) - ${e.departmentName}</option>`).join('');

            document.getElementById('processPayrollForm').reset();
            document.getElementById('procYear').value = new Date().getFullYear();
            document.getElementById('procMonth').value = new Date().getMonth() + 1;
            document.getElementById('payrollBasePreview').innerHTML = 'Select an employee to preview payroll calculations.';

            new bootstrap.Modal(document.getElementById('processPayrollModal')).show();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async onPayrollEmpChange() {
        const empId = document.getElementById('procEmpSelect').value;
        const previewBox = document.getElementById('payrollBasePreview');
        if (!empId) {
            previewBox.innerHTML = 'Select an employee to preview payroll calculations.';
            return;
        }

        try {
            const res = await api.get(`/api/salaries/employee/${empId}`);
            if (res && res.success) {
                const s = res.data;
                previewBox.innerHTML = `
                    <div class="row g-2">
                        <div class="col-4"><strong>Basic:</strong> ₹${app.formatNumber(s.basicSalary)}</div>
                        <div class="col-4"><strong>HRA+DA:</strong> ₹${app.formatNumber((s.hra||0) + (s.da||0))}</div>
                        <div class="col-4"><strong>PF+Tax:</strong> ₹${app.formatNumber((s.pf||0) + (s.tax||0))}</div>
                        <div class="col-12 mt-2 pt-1 border-top">
                            <span class="text-success fw-bold">Base Take-Home Net: ₹${app.formatNumber(s.netSalary)}</span> (OT Rate: ₹${s.overtimeRate}/hr)
                        </div>
                    </div>
                `;
            }
        } catch (e) {
            previewBox.innerHTML = '<span class="text-danger">Warning: Salary structure is not configured for this employee.</span>';
        }
    },

    async submitProcessPayroll(e) {
        e.preventDefault();
        const payload = {
            employeeId: parseInt(document.getElementById('procEmpSelect').value),
            month: parseInt(document.getElementById('procMonth').value),
            year: parseInt(document.getElementById('procYear').value),
            overtimeHours: parseFloat(document.getElementById('procOtHours').value) || 0,
            additionalBonus: parseFloat(document.getElementById('procBonus').value) || 0,
            additionalDeductions: parseFloat(document.getElementById('procDeductions').value) || 0,
            paymentMethod: document.getElementById('procPaymentMethod').value
        };

        try {
            const res = await api.post('/api/payroll/process', payload);
            if (res && res.success) {
                showToast(res.message, 'success');
                bootstrap.Modal.getInstance(document.getElementById('processPayrollModal')).hide();
                this.loadPayrollRecords();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async markPayrollPaid(id) {
        if (!confirm('Confirm disbursement of salary to employee?')) return;
        try {
            const res = await api.put(`/api/payroll/${id}/status`, { status: 'PAID' });
            if (res && res.success) {
                showToast(res.message, 'success');
                this.loadPayrollRecords();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async viewPayslipModal(id) {
        try {
            const res = await api.get(`/api/payroll/${id}/payslip`);
            if (!res || !res.success) return;
            const p = res.data;

            const content = `
                <div id="printablePayslip" class="p-3">
                    <div class="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
                        <div>
                            <h4 class="fw-bold text-navy mb-0">PAYTRACK</h4>
                            <div class="text-muted small">Corporate HR & Payroll Division | 100 Technology Blvd</div>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-primary fs-6 px-3 py-1">SALARY PAYSLIP</span>
                            <div class="small text-muted mt-1">Ref: <strong>${p.payrollNumber}</strong></div>
                            <div class="small text-muted">Period: Month ${p.month}/${p.year}</div>
                        </div>
                    </div>

                    <div class="row g-2 bg-light p-3 rounded mb-3 small">
                        <div class="col-6 col-sm-3"><span class="text-muted">Employee Code:</span><br><strong>${p.employeeCode}</strong></div>
                        <div class="col-6 col-sm-3"><span class="text-muted">Employee Name:</span><br><strong>${p.employeeName}</strong></div>
                        <div class="col-6 col-sm-3"><span class="text-muted">Department:</span><br><strong>${p.departmentName || '-'}</strong></div>
                        <div class="col-6 col-sm-3"><span class="text-muted">Designation:</span><br><strong>${p.designation}</strong></div>
                        <div class="col-6 col-sm-3 mt-2"><span class="text-muted">Payment Status:</span><br><span class="badge ${p.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}">${p.paymentStatus}</span></div>
                        <div class="col-6 col-sm-3 mt-2"><span class="text-muted">Payment Date:</span><br><strong>${p.paymentDate || 'Pending'}</strong></div>
                        <div class="col-6 col-sm-3 mt-2"><span class="text-muted">Payment Mode:</span><br><strong>${p.paymentMethod}</strong></div>
                    </div>

                    <div class="row g-3 mb-3">
                        <div class="col-6">
                            <table class="table table-sm table-bordered">
                                <thead class="table-light"><tr><th>Earnings</th><th class="text-end">Amount (₹)</th></tr></thead>
                                <tbody>
                                    <tr><td>Basic Salary</td><td class="text-end">${app.formatNumber(p.basicSalary)}</td></tr>
                                    <tr><td>HRA</td><td class="text-end">${app.formatNumber(p.hra)}</td></tr>
                                    <tr><td>DA</td><td class="text-end">${app.formatNumber(p.da)}</td></tr>
                                    <tr><td>Overtime Pay</td><td class="text-end">${app.formatNumber(p.overtimePay)}</td></tr>
                                    <tr><td>Bonus</td><td class="text-end">${app.formatNumber(p.bonus)}</td></tr>
                                    <tr><td>Other Allowances</td><td class="text-end">${app.formatNumber(p.otherAllowances)}</td></tr>
                                    <tr class="table-light fw-bold"><td>Gross Earnings</td><td class="text-end text-primary">₹${app.formatNumber(p.grossSalary)}</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="col-6">
                            <table class="table table-sm table-bordered">
                                <thead class="table-light"><tr><th>Deductions</th><th class="text-end">Amount (₹)</th></tr></thead>
                                <tbody>
                                    <tr><td>Provident Fund (PF)</td><td class="text-end">${app.formatNumber(p.pfDeduction)}</td></tr>
                                    <tr><td>Income Tax (TDS)</td><td class="text-end">${app.formatNumber(p.taxDeduction)}</td></tr>
                                    <tr><td>Other Deductions</td><td class="text-end">${app.formatNumber(p.otherDeductions)}</td></tr>
                                    <tr><td>-</td><td class="text-end">-</td></tr>
                                    <tr><td>-</td><td class="text-end">-</td></tr>
                                    <tr><td>-</td><td class="text-end">-</td></tr>
                                    <tr class="table-light fw-bold"><td>Total Deductions</td><td class="text-end text-danger">₹${app.formatNumber(p.totalDeductions)}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="p-3 bg-light rounded border d-flex justify-content-between align-items-center">
                        <div>
                            <div class="text-muted small">NET TAKE-HOME PAY:</div>
                            <h3 class="fw-bold text-success m-0">INR ₹${app.formatNumber(p.netSalary)}</h3>
                        </div>
                        <div class="text-end text-muted small">
                            Generated by PayTrack<br>Authorized Electronic Payslip
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('payslipModalContent').innerHTML = content;
            document.getElementById('modalDownloadPdfBtn').onclick = () => app.downloadPayslipPdf(p.id, p.payrollNumber);
            new bootstrap.Modal(document.getElementById('payslipModal')).show();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async downloadPayslipPdf(id, number) {
        try {
            showToast('Generating high-resolution payslip PDF...', 'info');
            const blob = await api.get(`/api/payroll/${id}/payslip/pdf`);
            if (!blob) return;

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payslip-${number || id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            showToast('Payslip PDF downloaded successfully!', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    printPayslipModal() {
        const printContent = document.getElementById('printablePayslip').innerHTML;
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
                <head>
                    <title>Print Payslip</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        .table-bordered th, .table-bordered td { border: 1px solid #cbd5e1 !important; }
                    </style>
                </head>
                <body>
                    ${printContent}
                    <script>window.onload = function() { window.print(); window.close(); }<\/script>
                </body>
            </html>
        `);
        win.document.close();
    }    ,
    // 6. ATTENDANCE MANAGEMENT
    async loadAttendanceRecords() {
        try {
            await this.loadDepartmentsList();
            const dateInput = document.getElementById('attendanceDatePicker');
            if (!dateInput.value) {
                dateInput.value = this.lastWorkingDayIso();
            }
            const date = dateInput.value;
            const deptId = document.getElementById('attendanceDeptFilter').value;

            let url = `/api/attendance?date=${date}`;
            if (deptId) url += `&departmentId=${deptId}`;

            const res = await api.get(url);
            const tbody = document.getElementById('attendanceTableBody');
            if (!tbody) return;

            if (!res || !res.success || !res.data.length) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No attendance records found for ${date}.</td></tr>`;
                return;
            }

            tbody.innerHTML = res.data.map(a => `
                <tr>
                    <td><strong>${a.employeeName}</strong> <small class="text-muted">(${a.employeeCode})</small></td>
                    <td>${a.departmentName || '-'}</td>
                    <td>${a.date}</td>
                    <td>${a.checkInTime || '-'}</td>
                    <td>${a.checkOutTime || '-'}</td>
                    <td><span class="badge ${a.status === 'PRESENT' ? 'badge-present' : (a.status === 'LATE' ? 'badge-late' : (a.status === 'ON_LEAVE' ? 'badge-leave' : 'badge-absent'))}">${a.status}</span></td>
                    <td><small class="text-muted">${a.remarks || '-'}</small></td>
                </tr>
            `).join('');
        } catch (e) {
            console.error('Error loading attendance:', e);
            const tbody = document.getElementById('attendanceTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No attendance logs found for this date.</td></tr>';
        }
    },

    async showMarkAttendanceModal() {
        try {
            const res = await api.get('/api/employees');
            if (!res || !res.success) return;

            const sel = document.getElementById('markAttEmp');
            sel.innerHTML = res.data.filter(e => e.status === 'ACTIVE')
                .map(e => `<option value="${e.id}">${e.fullName} (${e.employeeCode})</option>`).join('');

            document.getElementById('markAttendanceForm').reset();
            document.getElementById('markAttDate').value = this.lastWorkingDayIso();
            document.getElementById('markAttIn').value = '09:00';
            document.getElementById('markAttOut').value = '18:00';

            new bootstrap.Modal(document.getElementById('markAttendanceModal')).show();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async submitMarkAttendance(e) {
        e.preventDefault();
        const payload = {
            employeeId: parseInt(document.getElementById('markAttEmp').value),
            date: document.getElementById('markAttDate').value,
            status: document.getElementById('markAttStatus').value,
            checkInTime: document.getElementById('markAttIn').value || null,
            checkOutTime: document.getElementById('markAttOut').value || null,
            remarks: document.getElementById('markAttRemarks').value.trim()
        };

        try {
            const res = await api.post('/api/attendance/mark', payload);
            if (res && res.success) {
                showToast('Attendance recorded successfully', 'success');
                bootstrap.Modal.getInstance(document.getElementById('markAttendanceModal')).hide();
                this.loadAttendanceRecords();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async employeeCheckIn() {
        try {
            const res = await api.post('/api/employee/me/attendance/check-in', {});
            if (res && res.success) {
                showToast(res.message, 'success');
                this.refreshEmployeeSelfService();
            }
        } catch (err) {
            showToast(err.message, 'warning');
        }
    },

    async employeeCheckOut() {
        try {
            const res = await api.post('/api/employee/me/attendance/check-out', {});
            if (res && res.success) {
                showToast(res.message, 'success');
                this.refreshEmployeeSelfService();
            }
        } catch (err) {
            showToast(err.message, 'warning');
        }
    },

    // 7. LEAVE MANAGEMENT
    async loadLeaves() {
        try {
            const url = auth.isManager() ? '/api/manager/leaves' : '/api/leaves';
            const res = await api.get(url);
            const tbody = document.getElementById('leavesTableBody');
            if (!tbody) return;

            if (!res || !res.success || !res.data.length) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No leave requests found.</td></tr>';
                return;
            }

            tbody.innerHTML = res.data.map(l => `
                <tr>
                    <td><strong>${l.employeeName}</strong> <small class="text-muted">(${l.employeeCode})</small></td>
                    <td>${l.departmentName || '-'}</td>
                    <td><span class="badge badge-leave">${l.leaveType}</span></td>
                    <td>${l.startDate} to ${l.endDate}</td>
                    <td><strong>${l.totalDays}</strong> days</td>
                    <td>${l.reason}</td>
                    <td><span class="badge ${l.status === 'APPROVED' ? 'badge-approved' : (l.status === 'PENDING' ? 'badge-pending' : 'badge-rejected')}">${l.status}</span></td>
                    <td class="text-end">
                        ${l.status === 'PENDING' ? `
                            <button class="btn btn-sm btn-outline-primary" onclick="app.showReviewLeaveModal(${l.id}, '${l.employeeName}', '${l.leaveType}', '${l.startDate}', '${l.endDate}', ${l.totalDays}, '${l.reason.replace(/'/g, "\\'")}')">
                                <i class="bi bi-pencil-square me-1"></i> Review
                            </button>
                        ` : `<small class="text-muted">${l.reviewedBy ? 'by ' + l.reviewedBy : '-'}</small>`}
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            console.error('Error loading leaves:', e);
            const tbody = document.getElementById('leavesTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No leave requests found.</td></tr>';
        }
    },

    /** ISO date of today using the LOCAL calendar date (toISOString is UTC and can shift a day). */
    todayIso() {
        const d = new Date();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${m}-${dd}`;
    },

    /**
     * ISO date (local, not UTC) of the most recent weekday.
     * Attendance is not recorded on Sat/Sun, so defaulting to "today"
     * would show an empty table on a weekend.
     */
    lastWorkingDayIso() {
        const d = new Date();
        const day = d.getDay();
        if (day === 0) d.setDate(d.getDate() - 2);
        else if (day === 6) d.setDate(d.getDate() - 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    },

    refreshAttendanceView() {
        return auth.isManager() ? this.loadTeamAttendanceView() : this.loadAttendanceRecords();
    },

    refreshPayrollView() {
        return auth.isManager() ? this.loadTeamPayrollView() : this.loadPayrollRecords();
    },

    async loadTeamAttendanceView() {
        try {
            await this.ensureDepartmentsLoaded();
            const dateInput = document.getElementById('attendanceDatePicker');
            if (!dateInput.value) {
                dateInput.value = this.lastWorkingDayIso();
            }
            const date = dateInput.value;

            const res = await api.get(`/api/manager/team/attendance?date=${date}`);
            const tbody = document.getElementById('attendanceTableBody');
            if (!tbody) return;

            if (!res || !res.success || !res.data.length) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No team attendance records found for ${date}. Use "Mark Team Attendance" to record them.</td></tr>`;
                return;
            }

            tbody.innerHTML = res.data.map(a => `
                <tr>
                    <td><strong>${a.employeeName}</strong> <small class="text-muted">(${a.employeeCode})</small></td>
                    <td>${a.departmentName || '-'}</td>
                    <td>${a.date}</td>
                    <td>${a.checkInTime || '-'}</td>
                    <td>${a.checkOutTime || '-'}</td>
                    <td><span class="badge ${a.status === 'PRESENT' ? 'badge-present' : (a.status === 'LATE' ? 'badge-late' : (a.status === 'ON_LEAVE' ? 'badge-leave' : (a.status === 'HALF_DAY' ? 'badge-halfday' : 'badge-absent')))}">${a.status}</span></td>
                    <td><small class="text-muted">${a.remarks || '-'}</small></td>
                </tr>
            `).join('');
        } catch (e) {
            console.error('Error loading team attendance:', e);
            const tbody = document.getElementById('attendanceTableBody');
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">${e.message || 'Could not load team attendance.'}</td></tr>`;
        }
    },

    async loadTeamPayrollView() {
        try {
            const monthSel = document.getElementById('payrollMonthFilter');
            const yearInput = document.getElementById('payrollYearFilter');
            if (monthSel && !monthSel.value) monthSel.value = String(new Date().getMonth() + 1);
            if (yearInput && !yearInput.value) yearInput.value = String(new Date().getFullYear());
            const month = monthSel ? monthSel.value : new Date().getMonth() + 1;
            const year = yearInput ? yearInput.value : new Date().getFullYear();

            const res = await api.get('/api/manager/team/payroll');
            const tbody = document.getElementById('payrollTableBody');
            if (!tbody) return;

            const rows = (res && res.success ? res.data : [])
                .filter(p => Number(p.month) === Number(month) && Number(p.year) === Number(year));

            if (!rows.length) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No payroll records for ${month}/${year} in your team.</td></tr>`;
                return;
            }

            tbody.innerHTML = rows.map(p => `
                <tr>
                    <td class="fw-bold text-navy">${p.payrollNumber}</td>
                    <td><strong>${p.employeeName}</strong> <small class="text-muted">(${p.employeeCode})</small></td>
                    <td>${p.month}/${p.year}</td>
                    <td>₹${this.formatNumber(p.grossSalary)}</td>
                    <td class="text-danger">- ₹${this.formatNumber(p.totalDeductions)}</td>
                    <td class="fw-bold text-success">₹${this.formatNumber(p.netSalary)}</td>
                    <td><span class="badge ${p.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}">${p.paymentStatus}</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary p-1 px-2" onclick="app.viewPayslipModal(${p.id})" title="View Payslip"><i class="bi bi-eye"></i></button>
                        <button class="btn btn-sm btn-outline-success p-1 px-2 ms-1" onclick="app.downloadPayslipPdf(${p.id}, '${p.payrollNumber}')" title="Download PDF"><i class="bi bi-download"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            console.error('Error loading team payroll:', e);
            const tbody = document.getElementById('payrollTableBody');
            if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">${e.message || 'Could not load team payroll.'}</td></tr>`;
        }
    },

    async showMarkTeamAttendanceModal() {
        try {
            const dateInput = document.getElementById('attendanceDatePicker');
            const date = dateInput && dateInput.value ? dateInput.value : this.lastWorkingDayIso();

            const res = await api.get('/api/manager/team');
            if (!res || !res.success || !res.data.length) {
                showToast('No team members found in your department.', 'error');
                return;
            }

            const team = res.data.filter(e => e.status === 'ACTIVE');
            if (!team.length) {
                showToast('No active team members found.', 'error');
                return;
            }

            const existing = await api.get(`/api/manager/team/attendance?date=${date}`);
            const doneMap = {};
            if (existing && existing.success) {
                existing.data.forEach(a => { doneMap[a.employeeId] = a; });
            }

            const rows = team.map(e => {
                const rec = doneMap[e.id] || {};
                const st = rec.status || 'PRESENT';
                return `
                    <tr>
                        <td>
                            <strong>${e.fullName}</strong> <small class="text-muted">(${e.employeeCode})</small>
                            <input type="hidden" class="mt-emp-id" value="${e.id}">
                        </td>
                        <td>
                            <select class="form-select form-select-sm mt-status">
                                <option ${st === 'PRESENT' ? 'selected' : ''}>PRESENT</option>
                                <option ${st === 'LATE' ? 'selected' : ''}>LATE</option>
                                <option ${st === 'HALF_DAY' ? 'selected' : ''}>HALF_DAY</option>
                                <option ${st === 'ON_LEAVE' ? 'selected' : ''}>ON_LEAVE</option>
                                <option ${st === 'ABSENT' ? 'selected' : ''}>ABSENT</option>
                            </select>
                        </td>
                        <td><input type="time" class="form-control form-control-sm mt-checkin" value="${(rec.checkInTime || '09:00:00').slice(0, 5)}"></td>
                        <td><input type="time" class="form-control form-control-sm mt-checkout" value="${(rec.checkOutTime || '18:00:00').slice(0, 5)}"></td>
                        <td><input type="text" class="form-control form-control-sm mt-remarks" value="${(rec.remarks || '').replace(/"/g, '&quot;')}" placeholder="Optional"></td>
                    </tr>
                `;
            }).join('');

            document.getElementById('mtmDate').textContent = date;
            document.getElementById('mtmBody').innerHTML = rows;

            new bootstrap.Modal(document.getElementById('markTeamAttendanceModal')).show();
        } catch (e) {
            console.error('Error opening team attendance modal:', e);
            showToast(e.message || 'Could not load your team.', 'error');
        }
    },

    async saveTeamAttendance() {
        const date = document.getElementById('mtmDate').textContent;
        const rows = document.querySelectorAll('#mtmBody tr');

        if (!rows.length) {
            showToast('Nothing to save.', 'error');
            return;
        }

        const btn = document.getElementById('mtmSaveBtn');
        const original = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';
        }

        let ok = 0;
        const failures = [];

        for (const row of rows) {
            const idEl = row.querySelector('.mt-emp-id');
            if (!idEl) continue;
            const nameEl = row.querySelector('td strong');
            const name = nameEl ? nameEl.textContent.trim() : `#${idEl.value}`;

            const payload = {
                employeeId: Number(idEl.value),
                date: date,
                status: row.querySelector('.mt-status').value,
                checkInTime: row.querySelector('.mt-checkin').value,
                checkOutTime: row.querySelector('.mt-checkout').value,
                remarks: row.querySelector('.mt-remarks').value || null
            };

            try {
                await api.post('/api/manager/team/attendance/mark', payload);
                ok++;
            } catch (err) {
                failures.push(`${name}: ${err.message || 'failed'}`);
            }
        }

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = original;
        }

        const modalEl = document.getElementById('markTeamAttendanceModal');
        if (modalEl) {
            const inst = bootstrap.Modal.getInstance(modalEl);
            if (inst) inst.hide();
        }

        if (!failures.length) {
            showToast(`Attendance saved for ${ok} team member(s) on ${date}.`, 'success');
            this.loadTeamAttendanceView();
        } else {
            showToast(`Saved ${ok}, failed ${failures.length}.`, 'error');
            console.error('Team attendance failures:', failures);
            await this.loadTeamAttendanceView();
        }
    },

    showApplyLeaveModal() {
        document.getElementById('applyLeaveForm').reset();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().slice(0, 10);
        document.getElementById('leaveModalStart').value = dateStr;
        document.getElementById('leaveModalEnd').value = dateStr;
        this.calcLeaveDays();
        new bootstrap.Modal(document.getElementById('applyLeaveModal')).show();
    },

    calcLeaveDays() {
        const s = new Date(document.getElementById('leaveModalStart').value);
        const e = new Date(document.getElementById('leaveModalEnd').value);
        if (!isNaN(s) && !isNaN(e) && e >= s) {
            const diffTime = Math.abs(e - s);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            document.getElementById('leaveModalDaysText').textContent = `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
        } else {
            document.getElementById('leaveModalDaysText').textContent = 'Invalid date range';
        }
    },

    async submitApplyLeave(e) {
        e.preventDefault();
        const payload = {
            leaveType: document.getElementById('leaveModalType').value,
            startDate: document.getElementById('leaveModalStart').value,
            endDate: document.getElementById('leaveModalEnd').value,
            reason: document.getElementById('leaveModalReason').value.trim()
        };

        try {
            const res = await api.post('/api/employee/me/leaves', payload);
            if (res && res.success) {
                showToast('Leave request submitted successfully!', 'success');
                bootstrap.Modal.getInstance(document.getElementById('applyLeaveModal')).hide();
                this.refreshEmployeeSelfService();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    showReviewLeaveModal(id, empName, type, start, end, days, reason) {
        document.getElementById('revLeaveId').value = id;
        document.getElementById('revLeaveSummary').innerHTML = `
            <strong>Employee:</strong> ${empName}<br>
            <strong>Leave:</strong> ${type} (${days} days) &bull; ${start} to ${end}<br>
            <strong>Reason:</strong> "${reason}"
        `;
        document.getElementById('revLeaveRemarks').value = '';
        new bootstrap.Modal(document.getElementById('reviewLeaveModal')).show();
    },

    async submitReviewLeave(e) {
        e.preventDefault();
        const id = document.getElementById('revLeaveId').value;
        const payload = {
            status: document.getElementById('revLeaveDecision').value,
            managerRemarks: document.getElementById('revLeaveRemarks').value.trim()
        };

        try {
            const res = await api.post(`/api/leaves/${id}/review`, payload);
            if (res && res.success) {
                showToast(res.message, 'success');
                bootstrap.Modal.getInstance(document.getElementById('reviewLeaveModal')).hide();
                this.loadLeaves();
                if (auth.isManager()) this.loadDashboardData();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async quickReviewLeave(id, status) {
        try {
            const res = await api.post(`/api/leaves/${id}/review`, { status: status, managerRemarks: 'Quick ' + status.toLowerCase() });
            if (res && res.success) {
                showToast(`Leave request ${status.toLowerCase()}!`, 'success');
                this.loadDashboardData();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    // 8. REPORTS
    switchReportTab(tab) {
        this.currentReportTab = tab;
        document.querySelectorAll('#reportTabs .nav-link').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        this.loadReports();
    },

    async loadReports() {
        const area = document.getElementById('reportContentArea');
        const titleEl = document.getElementById('reportTitle');
        if (!area) return;

        area.innerHTML = '<div class="p-4 text-center text-muted">Generating report data...</div>';

        try {
            if (this.currentReportTab === 'payroll') {
                titleEl.textContent = 'Monthly Payroll Summary Report';
                const curMonth = new Date().getMonth() + 1;
                const curYear = new Date().getFullYear();
                const res = await api.get(`/api/reports/payroll?month=${curMonth}&year=${curYear}`);
                if (res && res.success) {
                    const d = res.data;
                    area.innerHTML = `
                        <div class="p-3 bg-light border-bottom d-flex flex-wrap gap-4 small">
                            <div><strong>Period:</strong> Month ${d.month}/${d.year}</div>
                            <div><strong>Total Employees Paid:</strong> ${d.paidCount} / ${d.totalRecords}</div>
                            <div><strong>Total Gross:</strong> ₹${app.formatNumber(d.totalGross)}</div>
                            <div><strong>Total Deductions:</strong> ₹${app.formatNumber(d.totalDeductions)}</div>
                            <div><strong>Net Payout:</strong> <span class="text-success fw-bold">₹${app.formatNumber(d.totalNet)}</span></div>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-custom table-bordered" id="reportDataTable">
                                <thead><tr><th>Ref #</th><th>Employee</th><th>Department</th><th>Gross</th><th>Deductions</th><th>Net Salary</th><th>Status</th></tr></thead>
                                <tbody>
                                    ${d.records.map(r => `
                                        <tr>
                                            <td>${r.payrollNumber}</td>
                                            <td>${r.employeeName}</td>
                                            <td>${r.departmentName || '-'}</td>
                                            <td>₹${app.formatNumber(r.grossSalary)}</td>
                                            <td>₹${app.formatNumber(r.totalDeductions)}</td>
                                            <td class="fw-bold text-success">₹${app.formatNumber(r.netSalary)}</td>
                                            <td>${r.paymentStatus}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }
            } else if (this.currentReportTab === 'departments') {
                titleEl.textContent = 'Department Staffing & Payroll Report';
                const res = await api.get('/api/reports/departments');
                if (res && res.success) {
                    area.innerHTML = `
                        <div class="table-responsive">
                            <table class="table table-custom table-bordered" id="reportDataTable">
                                <thead><tr><th>Dept Code</th><th>Department Name</th><th>Headcount</th><th>Current Month Net Payroll</th></tr></thead>
                                <tbody>
                                    ${res.data.map(r => `
                                        <tr>
                                            <td><strong>${r.departmentCode}</strong></td>
                                            <td>${r.departmentName}</td>
                                            <td><span class="badge bg-primary-subtle text-primary">${r.employeeCount}</span></td>
                                            <td class="fw-bold text-success">₹${app.formatNumber(r.currentMonthPayroll)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }
            } else if (this.currentReportTab === 'attendance') {
                titleEl.textContent = 'Monthly Attendance Summary Report';
                const curMonth = new Date().getMonth() + 1;
                const curYear = new Date().getFullYear();
                const res = await api.get(`/api/reports/attendance?month=${curMonth}&year=${curYear}`);
                if (res && res.success) {
                    area.innerHTML = `
                        <div class="table-responsive">
                            <table class="table table-custom table-bordered" id="reportDataTable">
                                <thead><tr><th>Code</th><th>Employee Name</th><th>Department</th><th>Present</th><th>Late</th><th>Absent</th><th>Leave</th><th>Attendance %</th></tr></thead>
                                <tbody>
                                    ${res.data.map(r => `
                                        <tr>
                                            <td>${r.employeeCode}</td>
                                            <td><strong>${r.employeeName}</strong></td>
                                            <td>${r.departmentName}</td>
                                            <td class="text-success">${r.presentDays}</td>
                                            <td class="text-warning">${r.lateDays}</td>
                                            <td class="text-danger">${r.absentDays}</td>
                                            <td class="text-primary">${r.leaveDays}</td>
                                            <td><strong>${r.attendancePercentage}%</strong></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }
            } else if (this.currentReportTab === 'leaves') {
                titleEl.textContent = 'Workforce Leave Balances Report';
                const curYear = new Date().getFullYear();
                const res = await api.get(`/api/reports/leaves?year=${curYear}`);
                if (res && res.success) {
                    area.innerHTML = `
                        <div class="table-responsive">
                            <table class="table table-custom table-bordered" id="reportDataTable">
                                <thead><tr><th>Employee</th><th>Dept</th><th>Casual Used/Total</th><th>Sick Used/Total</th><th>Annual Used/Total</th><th>Total Left</th></tr></thead>
                                <tbody>
                                    ${res.data.map(r => `
                                        <tr>
                                            <td><strong>${r.employeeName}</strong> (${r.employeeCode})</td>
                                            <td>${r.departmentName}</td>
                                            <td>${r.usedCasual} / ${r.casualLeaves}</td>
                                            <td>${r.usedSick} / ${r.sickLeaves}</td>
                                            <td>${r.usedAnnual} / ${r.annualLeaves}</td>
                                            <td class="fw-bold text-primary">${r.totalRemaining} days</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }
            }
        } catch (e) {
            area.innerHTML = '<div class="p-4 text-center text-danger">Error loading report data.</div>';
        }
    },

    exportReportTableToCSV() {
        const table = document.getElementById('reportDataTable');
        if (!table) return;

        let csv = [];
        const rows = table.querySelectorAll('tr');
        for (let i = 0; i < rows.length; i++) {
            let row = [], cols = rows[i].querySelectorAll('td, th');
            for (let j = 0; j < cols.length; j++) {
                row.push('"' + cols[j].innerText.replace(/"/g, '""').trim() + '"');
            }
            csv.push(row.join(','));
        }

        const csvFile = new Blob([csv.join('\n')], { type: 'text/csv' });
        const downloadLink = document.createElement('a');
        downloadLink.download = `report_${this.currentReportTab}_${new Date().toISOString().slice(0, 10)}.csv`;
        downloadLink.href = window.URL.createObjectURL(csvFile);
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
    },

    // 9. PROFILE & SETTINGS
    async loadProfile() {
        try {
            const res = await api.get('/api/profile');
            if (!res || !res.success) return;
            const p = res.data;

            document.getElementById('profileCardName').textContent = p.fullName || p.username;
            document.getElementById('profileCardDesignation').textContent = p.designation || '-';
            document.getElementById('profileCardRole').textContent = p.role.replace('ROLE_', '');
            document.getElementById('profileCardCode').textContent = p.employeeCode || 'N/A';
            document.getElementById('profileCardDept').textContent = p.departmentName || 'N/A';
            document.getElementById('profileCardJoin').textContent = p.joiningDate || 'N/A';
            document.getElementById('profileCardStatus').textContent = p.status || 'ACTIVE';
            document.getElementById('profileAvatarBig').textContent = (p.firstName ? p.firstName[0] : p.username[0]).toUpperCase();

            document.getElementById('profileEmail').value = p.email || '';
            document.getElementById('profilePhone').value = p.phone || '';
            document.getElementById('profileAddress').value = p.address || '';
        } catch (e) {
            console.error('Error loading profile:', e);
        }
    },

    async updateProfile(e) {
        e.preventDefault();
        const payload = {
            phone: document.getElementById('profilePhone').value.trim(),
            address: document.getElementById('profileAddress').value.trim()
        };

        try {
            const res = await api.put('/api/profile', payload);
            if (res && res.success) {
                showToast('Profile contact information updated!', 'success');
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async changePassword(e) {
        e.preventDefault();
        const cur = document.getElementById('currentPassword').value;
        const n1 = document.getElementById('newPassword').value;
        const n2 = document.getElementById('confirmNewPassword').value;

        if (n1 !== n2) {
            showToast('New passwords do not match!', 'error');
            return;
        }

        try {
            const res = await api.post('/api/profile/change-password', { currentPassword: cur, newPassword: n1 });
            if (res && res.success) {
                showToast('Password updated successfully!', 'success');
                document.getElementById('changePasswordForm').reset();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    // 10. USER ACCOUNTS (ADMIN ONLY)
    async loadUsers() {
        try {
            const res = await api.get('/api/admin/users');
            const tbody = document.getElementById('usersTableBody');
            if (!tbody) return;

            if (!res || !res.success || !res.data.length) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No users found.</td></tr>';
                return;
            }

            tbody.innerHTML = res.data.map(u => {
                const currentUsername = (this.currentUser && this.currentUser.username) ? this.currentUser.username.toLowerCase() : '';
                const isSelf = currentUsername && (u.username && u.username.toLowerCase() === currentUsername);
                const isActive = (u.accountStatus === 'ACTIVE' || u.status === 'ACTIVE');

                const statusBadge = isActive
                    ? '<span class="badge badge-active"><i class="bi bi-check-circle me-1"></i>ACTIVE</span>'
                    : '<span class="badge badge-inactive"><i class="bi bi-x-circle me-1"></i>INACTIVE</span>';

                let actionCell = '';
                if (isSelf) {
                    actionCell = '<span class="badge bg-secondary-subtle text-secondary border px-2 py-1"><i class="bi bi-shield-check me-1"></i>Current Admin</span>';
                } else if (isActive) {
                    actionCell = `<button class="btn btn-sm btn-outline-danger" onclick="app.confirmDeactivateUser(${u.userId}, '${u.username}')">
                        <i class="bi bi-person-x me-1"></i> Deactivate
                    </button>`;
                } else {
                    actionCell = `<button class="btn btn-sm btn-outline-success" onclick="app.activateUser(${u.userId})">
                        <i class="bi bi-person-check me-1"></i> Activate
                    </button>`;
                }

                return `
                <tr>
                    <td class="fw-bold text-navy">${u.username}</td>
                    <td>${u.fullName || (u.firstName ? (u.firstName + ' ' + (u.lastName || '')).trim() : '-')}</td>
                    <td><span class="badge bg-primary-subtle text-primary border">${u.role.replace('ROLE_', '')}</span></td>
                    <td>${u.employeeCode ? u.employeeCode + ' - ' + (u.departmentName || '') : (u.departmentName ? u.departmentName : 'None')}</td>
                    <td>${statusBadge}</td>
                    <td class="text-end">${actionCell}</td>
                </tr>
                `;
            }).join('');
        } catch (e) {
            console.error('Error loading users:', e);
            const tbody = document.getElementById('usersTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No user accounts found.</td></tr>';
        }
    },

    async confirmDeactivateUser(id, username) {
        const msg = `Are you sure you want to DEACTIVATE the user account "${username}"?\n\n` +
            `• The user's login credentials will immediately stop working.\n` +
            `• All employee profile, department, salary structure, attendance history, leave history, payroll history, and payslip data will remain SAFELY PRESERVED.\n` +
            `• No business records will be deleted.\n\n` +
            `Proceed with deactivation?`;

        if (!confirm(msg)) {
            return;
        }

        try {
            const res = await api.put(`/api/admin/users/${id}/deactivate`, {});
            if (res && res.success) {
                showToast(res.message || `User account "${username}" deactivated successfully`, 'success');
                this.loadUsers();
            }
        } catch (err) {
            showToast(err.message || 'Failed to deactivate user', 'error');
        }
    },

    async activateUser(id) {
        try {
            const res = await api.put(`/api/admin/users/${id}/activate`, {});
            if (res && res.success) {
                showToast(res.message || 'User account activated successfully', 'success');
                this.loadUsers();
            }
        } catch (err) {
            showToast(err.message || 'Failed to activate user', 'error');
        }
    },

    async toggleUserStatus(id) {
        try {
            const res = await api.put(`/api/admin/users/${id}/toggle-status`, {});
            if (res && res.success) {
                showToast(res.message || 'User status updated', 'success');
                this.loadUsers();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async showAddUserModal() {
        const form = document.getElementById('userForm');
        if (form) form.reset();

        // Ensure departments and employees are loaded
        if (!this.departments || !this.departments.length) {
            try {
                const res = await api.get('/api/departments');
                if (res && res.success) this.departments = res.data;
            } catch (e) {
                console.error('Failed to load departments:', e);
            }
        }
        if (!this.employees || !this.employees.length) {
            try {
                const res = await api.get('/api/employees');
                if (res && res.success) this.employees = res.data;
            } catch (e) {
                console.error('Failed to load employees:', e);
            }
        }

        // Populate Department dropdown
        const deptSelect = document.getElementById('newUserDept');
        if (deptSelect) {
            deptSelect.innerHTML = '<option value="">-- Select Department --</option>' +
                (this.departments || []).map(d => `<option value="${d.id}">${d.name} (${d.code})</option>`).join('');
        }

        // Populate Employee dropdown
        const empSelect = document.getElementById('newUserEmp');
        if (empSelect) {
            empSelect.innerHTML = '<option value="">-- Select Existing Employee --</option>' +
                (this.employees || []).map(e => {
                    const deptStr = e.departmentName ? ` [${e.departmentName}]` : '';
                    return `<option value="${e.id}" data-dept-id="${e.departmentId || ''}" data-email="${e.email || ''}" data-name="${e.fullName || ''}" data-code="${e.employeeCode || ''}">${e.employeeCode} - ${e.fullName}${deptStr}</option>`;
                }).join('');
        }

        this.onUserRoleChange();
        new bootstrap.Modal(document.getElementById('userModal')).show();
    },

    onUserRoleChange() {
        const role = document.getElementById('newUserRole').value;
        const deptSelect = document.getElementById('newUserDept');
        const empSelect = document.getElementById('newUserEmp');
        const deptLabel = document.getElementById('newUserDeptLabel');
        const empLabel = document.getElementById('newUserEmpLabel');
        const deptHelp = document.getElementById('newUserDeptHelp');
        const empHelp = document.getElementById('newUserEmpHelp');

        if (role === 'ROLE_MANAGER') {
            if (deptLabel) deptLabel.innerHTML = 'Department * <span class="text-danger">(Required for Manager)</span>';
            if (empLabel) empLabel.innerHTML = 'Link Employee Record * <span class="text-danger">(Required for Manager)</span>';
            if (deptSelect) deptSelect.required = true;
            if (empSelect) empSelect.required = true;
            if (deptHelp) deptHelp.textContent = 'Required: Manager must head or belong to a specific department.';
            if (empHelp) empHelp.textContent = 'Required: Manager profile is tied to this employee record.';
        } else if (role === 'ROLE_EMPLOYEE') {
            if (deptLabel) deptLabel.innerHTML = 'Department * <span class="text-danger">(Required for Employee)</span>';
            if (empLabel) empLabel.innerHTML = 'Link Employee Record * <span class="text-danger">(Required for Employee)</span>';
            if (deptSelect) deptSelect.required = true;
            if (empSelect) empSelect.required = true;
            if (deptHelp) deptHelp.textContent = 'Required: Employee must belong to a designated department.';
            if (empHelp) empHelp.textContent = 'Required: Self-service access is linked to this employee record.';
        } else if (role === 'ROLE_HR') {
            if (deptLabel) deptLabel.innerHTML = 'Department <span class="text-muted">(Optional / Selectable)</span>';
            if (empLabel) empLabel.innerHTML = 'Link Employee Record <span class="text-muted">(Optional)</span>';
            if (deptSelect) deptSelect.required = false;
            if (empSelect) empSelect.required = false;
            if (deptHelp) deptHelp.textContent = 'Optional: HR can manage company-wide operations across departments.';
            if (empHelp) empHelp.textContent = 'Optional: Link an employee record if HR has personal staff records.';
        } else {
            // ADMIN
            if (deptLabel) deptLabel.innerHTML = 'Department <span class="text-muted">(Optional)</span>';
            if (empLabel) empLabel.innerHTML = 'Link Employee Record <span class="text-muted">(Optional)</span>';
            if (deptSelect) deptSelect.required = false;
            if (empSelect) empSelect.required = false;
            if (deptHelp) deptHelp.textContent = 'Optional: System administrator has global access across all departments.';
            if (empHelp) empHelp.textContent = 'Optional: Standalone admin accounts do not require an employee profile.';
        }
    },

    onUserDeptChange() {
        const deptId = document.getElementById('newUserDept').value;
        const empSelect = document.getElementById('newUserEmp');
        if (!empSelect || !deptId) return;

        const selectedOpt = empSelect.options[empSelect.selectedIndex];
        if (selectedOpt && selectedOpt.value) {
            const empDeptId = selectedOpt.getAttribute('data-dept-id');
            if (empDeptId && empDeptId !== deptId) {
                showToast('Warning: Selected employee does not belong to the selected department.', 'warning');
            }
        }
    },

    onUserEmpChange() {
        const empSelect = document.getElementById('newUserEmp');
        if (!empSelect) return;
        const opt = empSelect.options[empSelect.selectedIndex];
        if (!opt || !opt.value) return;

        const deptId = opt.getAttribute('data-dept-id');
        const email = opt.getAttribute('data-email');
        const name = opt.getAttribute('data-name');
        const code = opt.getAttribute('data-code');

        if (deptId) {
            const deptSelect = document.getElementById('newUserDept');
            if (deptSelect) deptSelect.value = deptId;
        }

        const fullNameInput = document.getElementById('newUserFullName');
        if (fullNameInput && (!fullNameInput.value || fullNameInput.value.trim() === '')) {
            fullNameInput.value = name || '';
        }

        const emailInput = document.getElementById('newUserEmail');
        if (emailInput && (!emailInput.value || emailInput.value.trim() === '')) {
            emailInput.value = email || '';
        }

        const usernameInput = document.getElementById('newUserName');
        if (usernameInput && (!usernameInput.value || usernameInput.value.trim() === '')) {
            if (code) {
                usernameInput.value = code.toLowerCase();
            } else if (email) {
                usernameInput.value = email.split('@')[0].toLowerCase();
            }
        }
    },

    async saveUser(e) {
        e.preventDefault();
        const pwd = document.getElementById('newUserPassword').value;
        const confirmPwd = document.getElementById('newUserConfirmPassword').value;

        if (pwd !== confirmPwd) {
            showToast('Passwords do not match.', 'error');
            return;
        }

        const role = document.getElementById('newUserRole').value;
        const deptVal = document.getElementById('newUserDept').value;
        const empVal = document.getElementById('newUserEmp').value;

        if ((role === 'ROLE_MANAGER' || role === 'ROLE_EMPLOYEE')) {
            if (!deptVal) {
                showToast('Department is required for ' + role.replace('ROLE_', '') + ' role.', 'warning');
                return;
            }
            if (!empVal) {
                showToast('Employee linking is required for ' + role.replace('ROLE_', '') + ' role.', 'warning');
                return;
            }
        }

        const payload = {
            fullName: document.getElementById('newUserFullName').value.trim(),
            username: document.getElementById('newUserName').value.trim(),
            email: document.getElementById('newUserEmail').value.trim(),
            password: pwd,
            confirmPassword: confirmPwd,
            role: role,
            departmentId: deptVal ? parseInt(deptVal) : null,
            employeeId: empVal ? parseInt(empVal) : null,
            status: document.getElementById('newUserStatus').value
        };

        const saveBtn = document.getElementById('saveUserBtn');
        if (saveBtn) saveBtn.disabled = true;

        try {
            const res = await api.post('/api/admin/users', payload);
            if (res && res.success) {
                showToast(res.message || 'User account created successfully', 'success');
                const modalEl = document.getElementById('userModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                this.loadUsers();
            }
        } catch (err) {
            showToast(err.message || 'Failed to create user account', 'error');
        } finally {
            if (saveBtn) saveBtn.disabled = false;
        }
    },

    // AUDIT LOGS (ADMIN ONLY)
    async loadAuditLogs() {
        const tbody = document.getElementById('auditLogsTableBody');
        if (!tbody) return;

        try {
            const res = await api.get('/api/admin/audit-logs');
            if (!res || !res.success || !res.data || !res.data.length) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No audit logs recorded yet.</td></tr>';
                return;
            }

            tbody.innerHTML = res.data.map(log => {
                const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString() : '-';
                let actionBadge = 'bg-secondary';
                if (log.action.includes('CREATED') || log.action.includes('APPROVED') || log.action.includes('ACTIVATED')) {
                    actionBadge = 'bg-success';
                } else if (log.action.includes('UPDATED') || log.action.includes('PROCESSED')) {
                    actionBadge = 'bg-primary';
                } else if (log.action.includes('REJECTED') || log.action.includes('DEACTIVATED')) {
                    actionBadge = 'bg-danger';
                }
                return `
                    <tr>
                        <td class="small text-muted text-nowrap">${dateStr}</td>
                        <td><span class="badge ${actionBadge}">${log.action}</span></td>
                        <td><span class="badge bg-light text-dark border">${log.module}</span></td>
                        <td class="fw-semibold text-navy">${log.performedBy || 'System'}</td>
                        <td class="small">${log.details || '-'}</td>
                    </tr>
                `;
            }).join('');
        } catch (err) {
            console.error('Error loading audit logs:', err);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No audit logs recorded yet.</td></tr>';
        }
    },

    // 11. NOTIFICATIONS
    async pollNotifications() {
        try {
            const [countRes, listRes] = await Promise.all([
                api.get('/api/notifications/unread-count'),
                api.get('/api/notifications')
            ]);

            const count = countRes && countRes.data ? countRes.data.unreadCount : 0;
            const topBadge = document.getElementById('topNotifBadge');
            const sideBadge = document.getElementById('sidebarNotifBadge');

            if (count > 0) {
                topBadge.textContent = count;
                topBadge.classList.remove('d-none');
                sideBadge.textContent = count;
                sideBadge.classList.remove('d-none');
            } else {
                topBadge.classList.add('d-none');
                sideBadge.classList.add('d-none');
            }

            const dropdownList = document.getElementById('notifDropdownList');
            if (dropdownList && listRes && listRes.data) {
                if (!listRes.data.length) {
                    dropdownList.innerHTML = '<div class="p-3 text-center text-muted small">No notifications</div>';
                } else {
                    dropdownList.innerHTML = listRes.data.slice(0, 5).map(n => `
                        <div class="p-2 px-3 border-bottom ${n.isRead ? '' : 'bg-light'} cursor-pointer" onclick="app.markNotificationRead(${n.id})">
                            <div class="fw-semibold small text-navy">${this.esc(n.title)}</div>
                            <div class="text-muted" style="font-size: 11px;">${this.esc(n.message)}</div>
                        </div>
                    `).join('');
                }
            }
        } catch (e) {}
    },

    async loadFullNotifications() {
        try {
            const res = await api.get('/api/notifications');
            const list = document.getElementById('notificationsListFull');
            if (!list) return;

            if (!res || !res.success || !res.data.length) {
                list.innerHTML = '<div class="p-4 text-center text-muted">No notifications in your inbox.</div>';
                return;
            }

            list.innerHTML = res.data.map(n => `
                <div class="list-group-item d-flex justify-content-between align-items-center p-3 ${n.isRead ? '' : 'bg-light'}">
                    <div>
                        <div class="d-flex align-items-center gap-2 flex-wrap">
                            <span class="badge ${n.isRead ? 'bg-secondary' : 'bg-primary'}">${this.esc(n.type)}</span>
                            <h6 class="fw-bold text-navy m-0">${this.esc(n.title)}</h6>
                            ${n.recipientEmployeeId == null && n.recipientRole
                                ? `<span class="badge bg-info-subtle text-info border">All ${this.esc(n.recipientRole.replace('ROLE_', ''))}s</span>`
                                : ''}
                        </div>
                        <p class="text-muted small m-0 mt-1">${this.esc(n.message)}</p>
                        <small class="text-muted" style="font-size: 11px;">
                            ${n.createdAt ? this.esc(n.createdAt.replace('T', ' ').slice(0, 16)) : ''}
                            ${n.createdBy ? ' &middot; by ' + this.esc(n.createdBy) : ''}
                        </small>
                    </div>
                    ${!n.isRead ? `<button class="btn btn-sm btn-outline-secondary flex-shrink-0" onclick="app.markNotificationRead(${n.id})"><i class="bi bi-check"></i> Read</button>` : ''}
                </div>
            `).join('');
        } catch (e) {
            console.error('Error loading full notifications:', e);
        }
    },

    async markNotificationRead(id) {
        try {
            await api.put(`/api/notifications/${id}/read`, {});
            this.pollNotifications();
            if (window.location.hash === '#notifications') this.loadFullNotifications();
        } catch (e) {}
    },

    async markAllNotificationsRead() {
        try {
            await api.put('/api/notifications/mark-all-read', {});
            showToast('All notifications marked as read', 'success');
            this.pollNotifications();
            if (window.location.hash === '#notifications') this.loadFullNotifications();
        } catch (e) {}
    },

    showCreateNotificationModal() {
        if (!auth.isAdminOrHR()) {
            showToast('Only Admin and HR can create notifications', 'error');
            return;
        }
        document.getElementById('createNotificationForm').reset();
        document.getElementById('notifModalAudience').value = 'WORKFORCE';
        this.updateNotifAudienceHint();
        new bootstrap.Modal(document.getElementById('createNotificationModal')).show();
    },

    notifAudienceTargetRoles() {
        const audience = document.getElementById('notifModalAudience').value;
        if (audience === 'EVERYONE') return [];
        if (audience === 'WORKFORCE') return ['ROLE_EMPLOYEE', 'ROLE_MANAGER'];
        return [audience];
    },

    updateNotifAudienceHint() {
        const roles = this.notifAudienceTargetRoles();
        const hint = document.getElementById('notifAudienceHint');
        if (!hint) return;
        hint.textContent = roles.length
            ? 'Will appear for: ' + roles.map(r => r.replace('ROLE_', '')).join(', ')
            : 'Will appear for every user, including Admin and HR.';
    },

    async submitCreateNotification(e) {
        e.preventDefault();
        const payload = {
            title: document.getElementById('notifModalTitle').value.trim(),
            message: document.getElementById('notifModalMessage').value.trim(),
            type: document.getElementById('notifModalType').value,
            targetRoles: this.notifAudienceTargetRoles()
        };

        if (!payload.title || !payload.message) {
            showToast('Title and message are required', 'error');
            return;
        }

        try {
            const res = await api.post('/api/notifications/broadcast', payload);
            if (res && res.success) {
                showToast(res.message || 'Notification sent successfully', 'success');
                bootstrap.Modal.getInstance(document.getElementById('createNotificationModal')).hide();
                this.pollNotifications();
                this.loadFullNotifications();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    // UTILS
    formatNumber(num) {
        if (num === null || num === undefined) return '0.00';
        return parseFloat(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },

    setMoney(id, value) {
        this.setText(id, '₹' + this.formatNumber(value));
    },

    esc(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
};

window.addEventListener('DOMContentLoaded', () => app.init());