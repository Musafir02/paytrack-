// app.js - Frontend Logic Connecting to Java Backend

// --- User Management ---

// --- User Management ---

window.loadUsers = async () => {
    try {
        const response = await fetch('/api/users');
        const data = await response.json();
        const tbody = document.getElementById('users-table-body');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        if (data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="padding: 1rem; text-align: center;">No users found.</td></tr>';
            return;
        }

        data.data.forEach(user => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
            tr.innerHTML = `
                <td style="padding: 1rem;">#USR-${user.id}</td>
                <td style="padding: 1rem; color: white;">${user.username}</td>
                <td style="padding: 1rem;">
                    <span style="background: rgba(14, 165, 233, 0.2); color: #38bdf8; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.8rem;">
                        ${user.role}
                    </span>
                </td>
                <td style="padding: 1rem; text-align: right;">
                    <button class="btn" style="padding: 0.5rem; color: #ef4444;" onclick="deleteUser(${user.id}, '${user.username}')" title="Delete User">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        showToast("Failed to load users.", "error");
    }
};

window.openAddUserModal = () => {
    document.getElementById('addUserForm').reset();
    document.getElementById('addUserModal').style.display = 'flex';
};

window.closeAddUserModal = () => {
    document.getElementById('addUserModal').style.display = 'none';
};

window.submitUserForm = async (event) => {
    event.preventDefault();
    const user = {
        username: document.getElementById('newUsername').value,
        password: document.getElementById('newUserPassword').value,
        role: document.getElementById('newUserRole').value
    };

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });

        if (response.ok) {
            showToast("User added successfully", "success");
            window.closeAddUserModal();
            window.loadUsers();
        } else {
            const err = await response.json();
            showToast(err.error || "Failed to add user", "error");
        }
    } catch (error) {
        showToast("Network error", "error");
    }
};

window.deleteUser = async (id, username) => {
    if(!confirm(`Are you sure you want to delete user '${username}'?`)) return;

    try {
        const response = await fetch(`/api/users/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast("User deleted", "success");
            window.loadUsers();
        } else {
            showToast("Failed to delete user", "error");
        }
    } catch (error) {
        showToast("Network error", "error");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Toast Container
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);

    window.showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'info';
        let color = 'var(--text-main)';
        if (type === 'success') { icon = 'check_circle'; color = '#10b981'; }
        if (type === 'error') { icon = 'error'; color = '#f43f5e'; }

        toast.innerHTML = `<span class="material-symbols-outlined" style="color: ${color}">${icon}</span> ${message}`;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // 1.1 Auth Logic
    window.handleLogin = async (e) => {
        e.preventDefault();
        const user = document.getElementById('loginUsername').value;
        const pass = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass })
            });
            
            if (response.ok) {
                const data = await response.json();
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('app-container').style.display = 'flex';
                
                // Set user role
                if(document.getElementById('admin-badge')) document.getElementById('admin-badge').textContent = data.user.role;
                
                showToast(data.message, "success");
                loadDashboardStats();
            } else {
                showToast("Invalid credentials", "error");
            }
        } catch (error) {
            showToast("Backend connection failed", "error");
        }
    };

    // Global variable to store average salary for the payslip modal
    window.companyAvgSalary = 0;

    function formatCurrency(val) {
        if (val >= 10000000) return '₹' + (val / 10000000).toFixed(2) + ' Cr';
        if (val >= 100000) return '₹' + (val / 100000).toFixed(2) + ' L';
        return '₹' + val.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }

    // Global variable for chart instance
    window.deptChartInstance = null;

    // 2. Fetch Dashboard Stats
    async function loadDashboardStats() {
        try {
            const res = await fetch('/api/dashboard-stats');
            const data = await res.json();
            
            const statsGrid = document.getElementById('stats-grid');
            if(statsGrid) {
                statsGrid.innerHTML = `
                    <div class="glass-card">
                        <div class="stat-label">Total Employees</div>
                        <div class="stat-value">${data.totalEmployees}</div>
                    </div>
                    <div class="glass-card">
                        <div class="stat-label">Active Payrolls</div>
                        <div class="stat-value">${data.activePayrolls}</div>
                    </div>
                    <div class="glass-card">
                        <div class="stat-label">Total Payroll Cost</div>
                        <div class="stat-value" title="₹${data.totalPayrollCost.toLocaleString('en-IN')}">${formatCurrency(data.totalPayrollCost)}</div>
                    </div>
                    <div class="glass-card">
                        <div class="stat-label">Avg. Salary</div>
                        <div class="stat-value" title="₹${data.averageSalary.toLocaleString('en-IN')}">${formatCurrency(data.averageSalary)}</div>
                    </div>
                `;
                window.companyAvgSalary = data.averageSalary;
            }

        } catch (error) {
            console.error("Failed to load stats", error);
            showToast("Failed to load dashboard data from backend.", "error");
        }
    }

    // 3. Functional Buttons
    window.runPayrollCalculation = async () => {
        showToast("Processing batch payroll...", "info");
        try {
            const res = await fetch('/api/payroll/batch', {
                method: 'POST'
            });
            const data = await res.json();
            if(res.ok) {
                showToast(`Batch completed! Processed ${data.processedCount} records.`, "success");
                loadDashboardStats(); // Refresh stats
            } else {
                showToast("Error processing batch payroll", "error");
            }
        } catch (error) {
            showToast("Backend connection failed.", "error");
        }
    };

    window.adminAction = async (action) => {
        if(action === 'Factory Reset Data') {
            if(confirm("Are you sure you want to reset all payroll data? This cannot be undone.")) {
                showToast("Resetting data...", "info");
                try {
                    const res = await fetch('/api/payroll/reset', { method: 'POST' });
                    if(res.ok) {
                        showToast("Data reset successful.", "success");
                        loadDashboardStats();
                        if(currentPayslipsPage) loadPayslipsPage(currentPayslipsPage);
                        if(currentTaxesPage) loadTaxesPage(currentTaxesPage);
                    } else {
                        showToast("Failed to reset data.", "error");
                    }
                } catch (e) {
                    showToast("Backend connection failed.", "error");
                }
            }
        } else if (action === 'System Settings') {
            switchTab('settings', document.querySelector('.nav-item')); // Fallback to highlight nothing if needed
        } else if (action === 'Audit Logs') {
            switchTab('audit', document.querySelector('.nav-item'));
        } else {
            showToast(`Admin Action Triggered: ${action}`, "info");
        }
    };

    // Theme Switcher
    window.setTheme = (themeName) => {
        document.documentElement.className = '';
        if(themeName !== 'default') {
            document.documentElement.classList.add(`theme-${themeName}`);
        }
        showToast(`Theme changed to ${themeName}`, 'info');
    };

    // Modal Logic for Add Employee
    window.openAddEmployeeModal = () => {
        document.getElementById('addEmployeeModal').style.display = 'flex';
    };

    window.closeAddEmployeeModal = () => {
        document.getElementById('addEmployeeModal').style.display = 'none';
        document.getElementById('addEmployeeForm').reset();
    };

    window.submitEmployeeForm = async (e) => {
        e.preventDefault();
        const employee = {
            name: document.getElementById('empName').value.trim(),
            surname: document.getElementById('empSurname').value.trim(),
            age: parseInt(document.getElementById('empAge').value),
            department: document.getElementById('empDept').value,
            designation: document.getElementById('empDesig').value,
            baseSalary: parseFloat(document.getElementById('empSalary').value)
        };

        if(!/^[a-zA-Z\s]+$/.test(employee.name) || (employee.surname && !/^[a-zA-Z\s]+$/.test(employee.surname))) {
            showToast("Names cannot contain numbers or special characters", "error");
            return;
        }

        showToast("Saving employee...", "info");
        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employee)
            });
            if(res.ok) {
                showToast("Employee added successfully!", "success");
                closeAddEmployeeModal();
                loadEmployeesPage(currentPage);
                loadDashboardStats();
            } else {
                showToast("Error adding employee.", "error");
            }
        } catch (error) {
            showToast("Backend connection failed.", "error");
        }
    };

    // Modal Logic for Individual Payslip
    window.openGeneratePayslipModal = async (empId, empName) => {
        document.getElementById('generatePayslipEmpId').value = empId;
        document.getElementById('generatePayslipEmpName').innerText = empName;
        const now = new Date();
        document.getElementById('payslipMonth').value = now.getMonth() + 1;
        document.getElementById('payslipYear').value = now.getFullYear();
        
        showToast("Fetching payroll preview...", "info");
        try {
            const res = await fetch(`/api/calculate/preview?empId=${empId}&month=${now.getMonth()+1}&year=${now.getFullYear()}&allowances=1000`, { method: 'POST' });
            if(res.ok) {
                const data = await res.json();
                document.getElementById('previewBasic').value = data.basicSalary;
                document.getElementById('previewHra').value = data.hra;
                document.getElementById('previewDa').value = data.da;
                document.getElementById('previewAllowances').value = data.allowances;
                document.getElementById('previewTax').value = data.taxDeduction;
                document.getElementById('previewNet').value = data.netSalary;
                document.getElementById('generatePayslipModal').style.display = 'flex';
            } else {
                showToast("Failed to generate preview", "error");
            }
        } catch (e) {
            showToast("Backend connection failed", "error");
        }
    };

    window.recalculatePayslipPreview = () => {
        const basic = parseFloat(document.getElementById('previewBasic').value) || 0;
        const hra = parseFloat(document.getElementById('previewHra').value) || 0;
        const da = parseFloat(document.getElementById('previewDa').value) || 0;
        const allowances = parseFloat(document.getElementById('previewAllowances').value) || 0;
        const tax = parseFloat(document.getElementById('previewTax').value) || 0;
        
        const gross = basic + hra + da + allowances;
        const net = gross - tax;
        document.getElementById('previewNet').value = net;
    };

    window.closeGeneratePayslipModal = () => {
        document.getElementById('generatePayslipModal').style.display = 'none';
    };

    window.confirmGeneratePayslip = async (e) => {
        e.preventDefault();
        
        const payload = {
            employeeId: parseInt(document.getElementById('generatePayslipEmpId').value),
            month: parseInt(document.getElementById('payslipMonth').value),
            year: parseInt(document.getElementById('payslipYear').value),
            basicSalary: parseFloat(document.getElementById('previewBasic').value),
            hra: parseFloat(document.getElementById('previewHra').value),
            da: parseFloat(document.getElementById('previewDa').value),
            allowances: parseFloat(document.getElementById('previewAllowances').value),
            grossSalary: parseFloat(document.getElementById('previewBasic').value) + parseFloat(document.getElementById('previewHra').value) + parseFloat(document.getElementById('previewDa').value) + parseFloat(document.getElementById('previewAllowances').value),
            taxDeduction: parseFloat(document.getElementById('previewTax').value),
            netSalary: parseFloat(document.getElementById('previewNet').value)
        };

        showToast("Saving custom payslip...", "info");
        try {
            const res = await fetch(`/api/payroll/saveCustom`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if(res.ok) {
                showToast(`Payslip generated successfully!`, "success");
                closeGeneratePayslipModal();
                loadDashboardStats();
                exportPayslip(data.payslipId);
            } else {
                showToast("Error generating payslip.", "error");
            }
        } catch (error) {
            showToast("Backend connection failed.", "error");
        }
    };

    // SPA Tab Switching
    window.switchTab = (viewId, element) => {
        // Update active nav item if provided
        if(element) {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            element.classList.add('active');
        }

        // Update active view
        document.querySelectorAll('.view-section').forEach(view => {
            view.style.display = 'none';
            view.classList.remove('active-view');
        });
        const targetView = document.getElementById('view-' + viewId);
        if(targetView) {
            targetView.style.display = 'block';
            targetView.classList.add('active-view');
        }

        if(viewId === 'dashboard') {
            loadDashboardStats();
        } else if (viewId === 'employees') {
            loadEmployeesPage(1);
        } else if (viewId === 'payslips') {
            loadPayslipsPage(1);
        } else if (viewId === 'taxes') {
            loadTaxesPage(1);
        } else if (viewId === 'users') {
            window.loadUsers();
        }
    };

    // Employees Pagination
    let currentPage = 1;
    const limit = 50;

    window.handleEmployeeSearch = (e) => {
        if(e.key === 'Enter') {
            loadEmployeesPage(1, e.target.value.trim());
        }
    };

    window.loadEmployeesPage = async (page, searchQuery = '') => {
        currentPage = page;
        const info = document.getElementById('pagination-info');
        const tbody = document.getElementById('employees-table-body');
        const btnPrev = document.getElementById('btn-prev-page');
        const btnNext = document.getElementById('btn-next-page');

        if(info) info.innerText = `Loading page ${page}...`;
        if(tbody) tbody.innerHTML = `<tr><td colspan="9" style="padding: 1rem; text-align: center;">Loading...</td></tr>`;
        
        if(btnPrev) {
            btnPrev.style.display = page <= 1 ? 'none' : 'inline-block';
            btnPrev.disabled = page <= 1;
        }
        if(btnNext) btnNext.disabled = true;

        try {
            const url = searchQuery ? `/api/employees/search?query=${encodeURIComponent(searchQuery)}` : `/api/employees?page=${page}&limit=${limit}`;
            const res = await fetch(url);
            const result = await res.json();
            
            if(tbody && info) {
                tbody.innerHTML = '';
                result.data.forEach(emp => {
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
                    const dateObj = new Date(emp.dateJoined);
                    const formattedDate = !isNaN(dateObj) ? dateObj.toISOString().split('T')[0] : emp.dateJoined;
                    tr.innerHTML = `
                        <td style="padding: 1rem;">EMP-${emp.id}</td>
                        <td style="padding: 1rem; font-weight: 500; color: #fff;">${emp.name}</td>
                        <td style="padding: 1rem;">${emp.surname || ''}</td>
                        <td style="padding: 1rem;">${emp.age}</td>
                        <td style="padding: 1rem;">${emp.department}</td>
                        <td style="padding: 1rem;">${emp.designation}</td>
                        <td style="padding: 1rem;">₹${emp.baseSalary.toLocaleString('en-IN')}</td>
                        <td style="padding: 1rem;">${formattedDate}</td>
                        <td style="padding: 1rem; text-align: right;">
                            <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem; margin-right: 0.5rem;" onclick="openGeneratePayslipModal(${emp.id}, '${emp.name.replace(/'/g, "\\'")} ${emp.surname ? emp.surname.replace(/'/g, "\\'") : ''}')" title="Generate Payslip">Generate</button>
                            <button class="btn" style="padding: 0.5rem; color: #ef4444;" onclick="deleteEmployee(${emp.id}, '${emp.name.replace(/'/g, "\\'")}')" title="Delete Employee">
                                <span class="material-symbols-outlined" style="font-size: 1.2rem;">delete</span>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });

                const totalPages = Math.ceil(result.total / limit);
                info.innerText = `Showing page ${page} of ${totalPages} (${result.total} total employees)`;
                
                if(btnPrev) {
                    btnPrev.style.display = page <= 1 ? 'none' : 'inline-block';
                    btnPrev.disabled = page <= 1;
                }
                if(btnNext) btnNext.disabled = page >= totalPages;
            }
        } catch (error) {
            console.error("Failed to load employees", error);
            showToast("Failed to load employees.", "error");
        }
    };

    window.prevPage = () => {
        if(currentPage > 1) loadEmployeesPage(currentPage - 1);
    };

    window.nextPage = () => {
        loadEmployeesPage(currentPage + 1);
    };

    window.deleteEmployee = async (id, name) => {
        if(!confirm(`Are you sure you want to delete employee '${name}'?`)) return;
        try {
            const response = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
            if (response.ok) {
                showToast("Employee deleted successfully", "success");
                loadEmployeesPage(currentPage);
                loadDashboardStats();
            } else {
                showToast("Failed to delete employee", "error");
            }
        } catch (error) {
            showToast("Network error", "error");
        }
    };

    // Payslips Pagination
    let currentPayslipsPage = 1;

    window.loadPayslipsPage = async (page) => {
        currentPayslipsPage = page;
        const info = document.getElementById('payslips-pagination-info');
        const tbody = document.getElementById('payslips-table-body');
        const btnPrev = document.getElementById('btn-prev-payslips');
        const btnNext = document.getElementById('btn-next-payslips');

        if(info) info.innerText = `Loading page ${page}...`;
        if(tbody) tbody.innerHTML = `<tr><td colspan="5" style="padding: 1rem; text-align: center;">Loading...</td></tr>`;
        
        if(btnPrev) {
            btnPrev.style.display = page <= 1 ? 'none' : 'inline-block';
            btnPrev.disabled = page <= 1;
        }
        if(btnNext) btnNext.disabled = true;

        try {
            const res = await fetch(`/api/payslips?page=${page}&limit=${limit}`);
            const result = await res.json();
            
            if(tbody && info) {
                tbody.innerHTML = '';
                if(result.data.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="4" style="padding: 1rem; text-align: center;">No payslips generated for this period.</td></tr>`;
                    info.innerText = "No payslips found.";
                    return;
                }
                result.data.forEach(p => {
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
                    const dateObj = new Date(p.generationDate);
                    const formattedDate = !isNaN(dateObj) ? dateObj.toISOString().split('T')[0] : p.generationDate;
                    tr.innerHTML = `
                        <td style="padding: 1rem;">PAY-${p.id}</td>
                        <td style="padding: 1rem;">EMP-${p.employeeId}<br><span style="font-size:0.8rem;color:var(--text-muted)">${p.employeeName}</span></td>
                        <td style="padding: 1rem;">SAL-${p.salaryId}</td>
                        <td style="padding: 1rem;">${formattedDate}</td>
                        <td style="padding: 1rem;">${p.status}</td>
                        <td style="padding: 1rem; text-align: right;">
                            <button class="btn" style="padding: 0.5rem;" onclick="viewPayslip(${p.id})" title="View HTML">
                                <span class="material-symbols-outlined" style="font-size: 1.2rem;">visibility</span>
                            </button>
                            <button class="btn" style="padding: 0.5rem;" onclick="exportPayslip(${p.id})" title="Download Notepad">
                                <span class="material-symbols-outlined" style="font-size: 1.2rem;">download</span>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });

                const totalPages = Math.ceil(result.total / limit);
                info.innerText = `Showing page ${page} of ${totalPages} (${result.total} total payslips)`;
                
                if(btnPrev) {
                    btnPrev.style.display = page <= 1 ? 'none' : 'inline-block';
                    btnPrev.disabled = page <= 1;
                }
                if(btnNext) btnNext.disabled = page >= totalPages;
            }
        } catch (error) {
            console.error("Failed to load payslips", error);
        }
    };

    window.prevPayslipsPage = () => {
        if(currentPayslipsPage > 1) loadPayslipsPage(currentPayslipsPage - 1);
    };

    window.nextPayslipsPage = () => {
        loadPayslipsPage(currentPayslipsPage + 1);
    };

    // Taxes Pagination
    let currentTaxesPage = 1;

    window.loadTaxesPage = async (page) => {
        currentTaxesPage = page;
        const info = document.getElementById('taxes-pagination-info');
        const tbody = document.getElementById('taxes-table-body');
        const btnPrev = document.getElementById('btn-prev-taxes');
        const btnNext = document.getElementById('btn-next-taxes');

        if(info) info.innerText = `Loading page ${page}...`;
        if(tbody) tbody.innerHTML = `<tr><td colspan="5" style="padding: 1rem; text-align: center;">Loading...</td></tr>`;
        
        if(btnPrev) {
            btnPrev.style.display = page <= 1 ? 'none' : 'inline-block';
            btnPrev.disabled = page <= 1;
        }
        if(btnNext) btnNext.disabled = true;

        try {
            const res = await fetch(`/api/taxes?page=${page}&limit=${limit}`);
            const result = await res.json();
            
            if(tbody && info) {
                tbody.innerHTML = '';
                if(result.data.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="5" style="padding: 1rem; text-align: center;">Tax records will appear here after payroll processing.</td></tr>`;
                    info.innerText = "No tax records found.";
                    return;
                }
                result.data.forEach(s => {
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
                    tr.innerHTML = `
                        <td style="padding: 1rem;">SAL-${s.id}</td>
                        <td style="padding: 1rem;">EMP-${s.employeeId}<br><span style="font-size:0.8rem;color:var(--text-muted)">${s.employeeName}</span></td>
                        <td style="padding: 1rem;">₹${s.grossSalary.toLocaleString('en-IN')}</td>
                        <td style="padding: 1rem;">₹${s.taxDeduction.toLocaleString('en-IN')}</td>
                        <td style="padding: 1rem;">₹${s.netSalary.toLocaleString('en-IN')}</td>
                    `;
                    tbody.appendChild(tr);
                });

                const totalPages = Math.ceil(result.total / limit);
                info.innerText = `Showing page ${page} of ${totalPages} (${result.total} total tax records)`;
                
                if(btnPrev) {
                    btnPrev.style.display = page <= 1 ? 'none' : 'inline-block';
                    btnPrev.disabled = page <= 1;
                }
                if(btnNext) btnNext.disabled = page >= totalPages;
            }
        } catch (error) {
            console.error("Failed to load taxes", error);
        }
    };

    window.prevTaxesPage = () => {
        if(currentTaxesPage > 1) loadTaxesPage(currentTaxesPage - 1);
    };

    window.nextTaxesPage = () => {
        loadTaxesPage(currentTaxesPage + 1);
    };

    window.exportPayslip = async (id) => {
        showToast("Exporting to Notepad...", "info");
        try {
            const res = await fetch(`/api/payslips/export/${id}`);
            if(res.ok) {
                showToast("Payslip opened in Notepad!", "success");
            } else {
                showToast("Failed to export payslip.", "error");
            }
        } catch (error) {
            showToast("Backend connection failed.", "error");
        }
    };

    // 13. View Individual Payslip
    window.viewPayslip = async (id) => {
        showToast("Opening payslip preview...", "info");
        try {
            const res = await fetch(`/api/payslips/view/${id}`);
            if(res.ok) {
                showToast("Payslip opened in browser!", "success");
            } else {
                showToast("Failed to view payslip.", "error");
            }
        } catch (error) {
            showToast("Backend connection failed.", "error");
        }
    };

    window.exportAllPayslips = async () => {
        showToast("Exporting all payslips to Notepad...", "info");
        try {
            const res = await fetch(`/api/payslips/export-all`);
            if(res.ok) {
                showToast("All payslips opened in Notepad!", "success");
            } else {
                showToast("Failed to export all payslips.", "error");
            }
        } catch (error) {
            showToast("Backend connection failed.", "error");
        }
    };

    // Initial setup - don't load data yet, wait for login
    // loadDashboardStats();
});
