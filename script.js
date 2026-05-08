// Configuration
const CATEGORIES = {
    income: ['Salary', 'Bonus', 'Other'],
    expense: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Other']
};

let transactions = [];
let incomeExpenseChart = null;
let expensePieChart = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
    populateCategories();
    setTodayDate();
    updateDashboard();
    updateCharts();
    
    // Event listeners
    document.getElementById('transactionForm').addEventListener('submit', handleAddTransaction);
    document.getElementById('type').addEventListener('change', populateCategories);
    document.getElementById('filterType').addEventListener('change', filterTransactions);
    document.getElementById('clearData').addEventListener('click', handleClearData);
});

// Set today's date as default
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// Populate category dropdown based on transaction type
function populateCategories() {
    const type = document.getElementById('type').value;
    const categorySelect = document.getElementById('category');
    const categories = CATEGORIES[type] || [];
    
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// Handle adding new transaction
function handleAddTransaction(e) {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        date: document.getElementById('date').value
    };
    
    if (!transaction.category) {
        alert('Please select a category');
        return;
    }
    
    transactions.push(transaction);
    saveTransactions();
    
    // Reset form
    document.getElementById('transactionForm').reset();
    setTodayDate();
    populateCategories();
    
    updateDashboard();
    updateCharts();
    displayTransactions();
    
    // Show success feedback
    showNotification('Transaction added successfully!');
}

// Display transactions in the list
function displayTransactions() {
    const transactionList = document.getElementById('transactionList');
    
    if (transactions.length === 0) {
        transactionList.innerHTML = '<p class="empty-state">No transactions yet. Add your first transaction!</p>';
        return;
    }
    
    // Sort by date (most recent first)
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    transactionList.innerHTML = sorted.map(transaction => `
        <div class="transaction-item ${transaction.type}">
            <div class="transaction-info">
                <div class="transaction-description">${escapeHtml(transaction.description)}</div>
                <div class="transaction-meta">
                    <span>${transaction.category}</span>
                    <span>${formatDate(transaction.date)}</span>
                </div>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}₹${Math.round(transaction.amount)}
            </div>
            <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">Delete</button>
        </div>
    `).join('');
}

// Delete transaction
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        updateDashboard();
        updateCharts();
        displayTransactions();
        showNotification('Transaction deleted!');
    }
}

// Filter transactions
function filterTransactions() {
    const filterType = document.getElementById('filterType').value;
    const transactionList = document.getElementById('transactionList');
    
    const filtered = filterType ? transactions.filter(t => t.type === filterType) : transactions;
    
    if (filtered.length === 0) {
        transactionList.innerHTML = '<p class="empty-state">No transactions found.</p>';
        return;
    }
    
    const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    transactionList.innerHTML = sorted.map(transaction => `
        <div class="transaction-item ${transaction.type}">
            <div class="transaction-info">
                <div class="transaction-description">${escapeHtml(transaction.description)}</div>
                <div class="transaction-meta">
                    <span>${transaction.category}</span>
                    <span>${formatDate(transaction.date)}</span>
                </div>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}₹${Math.round(transaction.amount)}
            </div>
            <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">Delete</button>
        </div>
    `).join('');
}

// Update dashboard metrics
function updateDashboard() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0;
    
    document.getElementById('totalBalance').textContent = `₹${Math.round(totalBalance)}`;
    document.getElementById('totalIncome').textContent = `₹${Math.round(totalIncome)}`;
    document.getElementById('totalExpenses').textContent = `₹${Math.round(totalExpenses)}`;
    document.getElementById('savingsRate').textContent = `${savingsRate}%`;
    
    // Update balance color based on positive/negative
    const balanceElement = document.getElementById('totalBalance');
    if (totalBalance >= 0) {
        balanceElement.style.color = 'var(--success-color)';
    } else {
        balanceElement.style.color = 'var(--danger-color)';
    }
}

// Update all charts
function updateCharts() {
    updateExpensePieChart();
    updateIncomeExpenseChart();
    updateCategorySummary();
}

// Pie chart for expenses by category
function updateExpensePieChart() {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryData = {};
    
    expenses.forEach(t => {
        categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
    });
    
    const ctx = document.getElementById('expensePieChart');
    
    // Destroy existing chart if it exists
    if (expensePieChart) {
        expensePieChart.destroy();
    }
    
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b',
        '#fa709a', '#fee140', '#30b0fe', '#a8edea', '#fed6e3'
    ];
    
    expensePieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: colors.slice(0, Object.keys(categoryData).length),
                borderColor: 'white',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12, weight: '600' }
                    }
                }
            }
        }
    });
}

// Bar chart for income vs expenses
function updateIncomeExpenseChart() {
    // Group by month
    const monthlyData = {};
    
    transactions.forEach(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expense: 0 };
        }
        
        if (t.type === 'income') {
            monthlyData[monthKey].income += t.amount;
        } else {
            monthlyData[monthKey].expense += t.amount;
        }
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    const incomeValues = sortedMonths.map(m => monthlyData[m].income);
    const expenseValues = sortedMonths.map(m => monthlyData[m].expense);
    
    const ctx = document.getElementById('incomeExpenseChart');
    
    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }
    
    incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedMonths,
            datasets: [
                {
                    label: 'Income',
                    data: incomeValues,
                    backgroundColor: 'var(--success-color)',
                    borderRadius: 5
                },
                {
                    label: 'Expenses',
                    data: expenseValues,
                    backgroundColor: 'var(--danger-color)',
                    borderRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        padding: 15,
                        font: { size: 12, weight: '600' }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

// Update category summary
function updateCategorySummary() {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryData = {};
    
    expenses.forEach(t => {
        categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
    });
    
    const summarDiv = document.getElementById('categorySummary');
    
    if (Object.keys(categoryData).length === 0) {
        summarDiv.innerHTML = '<p class="empty-state">Add expenses to see category breakdown</p>';
        return;
    }
    
    const sorted = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
    
    summarDiv.innerHTML = sorted.map(([category, amount]) => `
        <div class="category-item">
            <span class="category-name">${category}</span>
            <span class="category-amount">₹${Math.round(amount)}</span>
        </div>
    `).join('');
}

// Local storage functions
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function loadTransactions() {
    const saved = localStorage.getItem('transactions');
    transactions = saved ? JSON.parse(saved) : [];
    displayTransactions();
}

// Clear all data
function handleClearData() {
    if (confirm('Are you sure you want to delete ALL transactions? This cannot be undone.')) {
        transactions = [];
        saveTransactions();
        updateDashboard();
        updateCharts();
        displayTransactions();
        showNotification('All data cleared!');
    }
}

// Helper functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message) {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}
