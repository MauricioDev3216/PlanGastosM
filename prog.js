
// CONFIGURAÇÃO DO SUPABASE

const SUPABASE_URL = 'https://qqxttxwxrakhbpzyubsc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeHR0eHd4cmFraGJwenl1YnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTg1MzMsImV4cCI6MjA4MDI3NDUzM30.naV_3GuPkuq1FandcZPYhSNzXLLlV9dCEc0Lf2AXiYo';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado global
let expenses = [];
let currentDate = new Date();
let categoryChart = null;
let dailyChart = null;
let monthlyBudget = 0;
let currentUser = null;

// ===== AUTENTICAÇÃO =====
function checkAuth() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        window.location.href = 'index.html';
        return null;
    }
    currentUser = JSON.parse(userStr);
    return currentUser;
}

function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// ===== SIDEBAR =====
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
}

// ===== MODO ESCURO =====
function toggleDarkMode() {
    const html = document.documentElement;
    const moonIcon = document.getElementById('moonIconSidebar');
    const sunIcon = document.getElementById('sunIconSidebar');
    const text = document.getElementById('darkModeText');
    
    html.classList.toggle('dark');
    const isDark = html.classList.contains('dark');
    
    if (isDark) {
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
        text.textContent = 'Modo Claro';
    } else {
        moonIcon.classList.remove('hidden');
        sunIcon.classList.add('hidden');
        text.textContent = 'Modo Escuro';
    }
    
    localStorage.setItem('darkMode', isDark.toString());
    updateCategoryChart();
    updateDailyChart();
}

function initDarkMode() {
    const darkMode = localStorage.getItem('darkMode');
    const html = document.documentElement;
    const moonIcon = document.getElementById('moonIconSidebar');
    const sunIcon = document.getElementById('sunIconSidebar');
    const text = document.getElementById('darkModeText');
    
    if (darkMode === 'true') {
        html.classList.add('dark');
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
        text.textContent = 'Modo Claro';
    }
}

// ===== BANCO DE DADOS =====
async function loadExpensesFromDB() {
    try {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('date', { ascending: false });

        if (error) throw error;

        expenses = data.map(expense => ({
            id: expense.id,
            description: expense.description,
            amount: parseFloat(expense.amount),
            category: expense.category,
            date: expense.date
        }));

        return expenses;
    } catch (error) {
        console.error('Erro ao carregar gastos:', error);
        return [];
    }
}

async function saveExpenseToDB(expense) {
    try {
        const { data, error } = await supabase
            .from('expenses')
            .insert([{
                user_id: currentUser.id,
                description: expense.description,
                amount: expense.amount,
                category: expense.category,
                date: expense.date
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao salvar gasto:', error);
        return { success: false, error };
    }
}

async function deleteExpenseFromDB(expenseId) {
    try {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', expenseId)
            .eq('user_id', currentUser.id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar gasto:', error);
        return { success: false, error };
    }
}

async function loadBudgetFromDB() {
    try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const { data, error } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('month', month)
            .eq('year', year)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
            monthlyBudget = parseFloat(data.amount);
        }
    } catch (error) {
        console.error('Erro ao carregar orçamento:', error);
    }
}

async function saveBudgetToDB(amount) {
    try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const { data, error } = await supabase
            .from('budgets')
            .upsert([{
                user_id: currentUser.id,
                amount: amount,
                month: month,
                year: year
            }], {
                onConflict: 'user_id,month,year'
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao salvar orçamento:', error);
        return { success: false, error };
    }
}

// ===== ORÇAMENTO =====
function updateBudgetDisplay() {
    const now = new Date();
    const monthExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date + 'T00:00:00');
        return expenseDate.getMonth() === now.getMonth() && 
               expenseDate.getFullYear() === now.getFullYear();
    });
    
    const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = monthlyBudget - totalSpent;
    const percentage = monthlyBudget > 0 ? Math.min((totalSpent / monthlyBudget) * 100, 100) : 0;
    
    document.getElementById('budgetTotal').textContent = `R$ ${monthlyBudget.toFixed(2).replace('.', ',')}`;
    document.getElementById('budgetSpent').textContent = `R$ ${totalSpent.toFixed(2).replace('.', ',')}`;
    document.getElementById('budgetRemaining').textContent = `R$ ${remaining.toFixed(2).replace('.', ',')}`;
    document.getElementById('budgetPercentage').textContent = `${percentage.toFixed(1)}%`;
    
    const bar = document.getElementById('budgetBar');
    const barText = document.getElementById('budgetBarText');
    const status = document.getElementById('budgetStatus');
    
    bar.style.width = `${percentage}%`;
    
    if (percentage >= 100) {
        bar.className = 'h-full bg-gradient-to-r from-red-600 to-red-700 transition-all duration-500 flex items-center justify-center text-white font-bold text-sm';
        status.textContent = '⚠️ Orçamento excedido!';
        status.className = 'text-sm text-red-600 dark:text-red-400 mt-2 text-center font-bold';
        barText.textContent = 'LIMITE EXCEDIDO';
        document.getElementById('budgetRemaining').className = 'text-2xl font-bold text-red-700 dark:text-red-300';
    } else if (percentage >= 80) {
        bar.className = 'h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 flex items-center justify-center text-white font-bold text-sm';
        status.textContent = '⚠️ Atenção! Você gastou mais de 80% do orçamento';
        status.className = 'text-sm text-orange-600 dark:text-orange-400 mt-2 text-center font-semibold';
        barText.textContent = `${percentage.toFixed(0)}%`;
        document.getElementById('budgetRemaining').className = 'text-2xl font-bold text-orange-700 dark:text-orange-300';
    } else if (percentage >= 50) {
        bar.className = 'h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500 flex items-center justify-center text-white font-bold text-sm';
        status.textContent = `✓ Você gastou ${percentage.toFixed(1)}% do orçamento`;
        status.className = 'text-sm text-gray-600 dark:text-gray-300 mt-2 text-center font-medium';
        barText.textContent = `${percentage.toFixed(0)}%`;
        document.getElementById('budgetRemaining').className = 'text-2xl font-bold text-green-700 dark:text-green-300';
    } else {
        bar.className = 'h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500 flex items-center justify-center text-white font-bold text-sm';
        status.textContent = `✓ Está indo bem! ${(100 - percentage).toFixed(1)}% do orçamento ainda disponível`;
        status.className = 'text-sm text-green-600 dark:text-green-400 mt-2 text-center font-semibold';
        barText.textContent = percentage > 10 ? `${percentage.toFixed(0)}%` : '';
        document.getElementById('budgetRemaining').className = 'text-2xl font-bold text-green-700 dark:text-green-300';
    }
}

async function setBudget() {
    const input = document.getElementById('budgetInput');
    const value = parseFloat(input.value);
    
    if (isNaN(value) || value <= 0) {
        alert('Por favor, digite um valor válido para o orçamento!');
        return;
    }
    
    const result = await saveBudgetToDB(value);
    
    if (result.success) {
        monthlyBudget = value;
        updateBudgetDisplay();
        input.value = '';
        
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Definido!';
        btn.classList.add('!bg-green-600');
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('!bg-green-600');
        }, 2000);
    } else {
        alert('Erro ao salvar orçamento. Tente novamente.');
    }
}

// ===== ADICIONAR GASTO =====
const expenseForm = document.getElementById('expenseForm');

if (expenseForm) {
    expenseForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const description = document.getElementById('description').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;

        if (!description || isNaN(amount) || amount <= 0 || !category || !date) {
            alert('Por favor, preencha todos os campos corretamente!');
            return;
        }

        const btn = this.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Salvando...';
        btn.disabled = true;

        const expense = {
            description: description,
            amount: amount,
            category: category,
            date: date
        };

        const result = await saveExpenseToDB(expense);

        if (result.success) {
            expenses.push({
                id: result.data.id,
                ...expense
            });

            updateAll();
            this.reset();
            
            const today = new Date();
            document.getElementById('date').value = today.toISOString().split('T')[0];
            
            btn.innerHTML = 'Adicionado!';
            const originalClasses = btn.className;
            btn.className = btn.className.replace(/from-\S+/g, 'from-green-600').replace(/to-\S+/g, 'to-green-700');
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.className = originalClasses;
                btn.disabled = false;
            }, 2000);
        } else {
            alert('Erro ao salvar gasto. Tente novamente.');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// ===== DELETAR GASTO =====
window.deleteExpense = async function(id) {
    if (confirm('Deseja realmente excluir este gasto?')) {
        const result = await deleteExpenseFromDB(id);
        
        if (result.success) {
            expenses = expenses.filter(e => e.id !== id);
            updateAll();
        } else {
            alert('Erro ao deletar gasto. Tente novamente.');
        }
    }
};

// ===== RESUMO =====
function updateSummary() {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    document.getElementById('totalExpense').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

    const now = new Date();
    const thisMonth = expenses.filter(e => {
        const expenseDate = new Date(e.date + 'T00:00:00');
        return expenseDate.getMonth() === now.getMonth() && 
               expenseDate.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + e.amount, 0);
    document.getElementById('monthExpense').textContent = `R$ ${thisMonth.toFixed(2).replace('.', ',')}`;

    const today = now.toISOString().split('T')[0];
    const todayTotal = expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);
    document.getElementById('todayExpense').textContent = `R$ ${todayTotal.toFixed(2).replace('.', ',')}`;
}

// ===== GRÁFICOS =====
function updateCategoryChart() {
    const categories = {};
    expenses.forEach(e => {
        categories[e.category] = (categories[e.category] || 0) + e.amount;
    });

    const ctx = document.getElementById('categoryChart');
    const isDark = document.documentElement.classList.contains('dark');
    
    if (categoryChart) categoryChart.destroy();

    if (Object.keys(categories).length === 0) {
        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Sem dados'],
                datasets: [{
                    data: [1],
                    backgroundColor: [isDark ? '#4B5563' : '#E5E7EB'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: {
                            color: isDark ? '#F9FAFB' : '#111827',
                            padding: 15,
                            font: { size: 13, weight: 'bold' }
                        }
                    }
                }
            }
        });
        return;
    }

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'],
                borderWidth: 3,
                borderColor: isDark ? '#1F2937' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: {
                        color: isDark ? '#F9FAFB' : '#111827',
                        padding: 15,
                        font: { size: 13, weight: 'bold' }
                    }
                }
            }
        }
    });
}

function updateDailyChart() {
    const last7Days = [];
    const dailyExpenses = {};

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        last7Days.push(dateStr);
        dailyExpenses[dateStr] = 0;
    }

    expenses.forEach(e => {
        if (dailyExpenses.hasOwnProperty(e.date)) {
            dailyExpenses[e.date] += e.amount;
        }
    });

    const ctx = document.getElementById('dailyChart');
    const isDark = document.documentElement.classList.contains('dark');
    
    if (dailyChart) dailyChart.destroy();

    dailyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last7Days.map(d => {
                const date = new Date(d + 'T00:00:00');
                return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
            }),
            datasets: [{
                label: 'Gastos (R$)',
                data: last7Days.map(d => dailyExpenses[d]),
                backgroundColor: isDark ? '#8B5CF6' : '#6366F1',
                borderRadius: 8,
                borderWidth: 2,
                borderColor: isDark ? '#A78BFA' : '#818CF8'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: isDark ? '#F9FAFB' : '#111827',
                        font: { size: 12, weight: 'bold' },
                        callback: value => 'R$ ' + value.toFixed(0)
                    },
                    grid: { color: isDark ? '#374151' : '#E5E7EB', drawBorder: false }
                },
                x: {
                    ticks: { color: isDark ? '#F9FAFB' : '#111827', font: { size: 12, weight: 'bold' } },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { labels: { color: isDark ? '#F9FAFB' : '#111827', font: { size: 13, weight: 'bold' } } }
            }
        }
    });
}

function updateCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('currentMonth').textContent = 
        currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
        calendarDays.innerHTML += '<div></div>';
    }

    const today = new Date().toISOString().split('T')[0];
    const isDark = document.documentElement.classList.contains('dark');
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayExpenses = expenses.filter(e => e.date === dateStr);
        const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
        const isToday = dateStr === today;

        let dayClass = '';
        if (isToday) {
            dayClass = isDark ? 'bg-indigo-900 border-2 border-indigo-400 text-white' : 'bg-indigo-100 border-2 border-indigo-600 text-gray-900';
        } else if (total > 0) {
            dayClass = isDark ? 'bg-red-900/60 border-2 border-red-600 text-white' : 'bg-red-50 border-2 border-red-400 text-gray-900';
        } else {
            dayClass = isDark ? 'bg-gray-700 border border-gray-600 text-gray-200' : 'bg-gray-50 border border-gray-300 text-gray-900';
        }
        
        const dayDiv = document.createElement('div');
        dayDiv.className = `${dayClass} rounded-lg p-2 cursor-pointer hover:scale-105 hover:shadow-md transition-all duration-200`;
        dayDiv.onclick = () => showDayExpenses(dateStr);
        dayDiv.innerHTML = `
            <div class="font-bold text-center">${day}</div>
            ${total > 0 ? `<div class="text-xs font-bold text-center mt-1 ${isDark ? 'text-red-300' : 'text-red-700'}">R$ ${total.toFixed(0)}</div>` : ''}
        `;
        calendarDays.appendChild(dayDiv);
    }
}

document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
});

// ===== MODAL DE DIA =====
window.showDayExpenses = function(date) {
    const dayExpenses = expenses.filter(e => e.date === date);
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dayFormatted = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    document.getElementById('modalDayTitle').textContent = dayFormatted;
    document.getElementById('modalDaySubtitle').textContent = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    
    const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    document.getElementById('modalDayTotal').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    
    const modalContent = document.getElementById('modalDayExpenses');
    
    if (dayExpenses.length === 0) {
        modalContent.innerHTML = `
            <div class="text-center py-12">
                <p class="text-gray-600 dark:text-gray-300 text-lg font-semibold mb-2">Nenhum gasto neste dia</p>
                <p class="text-gray-500 dark:text-gray-400 text-sm">Este dia está livre de gastos!</p>
            </div>
        `;
    } else {
        const byCategory = {};
        dayExpenses.forEach(e => {
            if (!byCategory[e.category]) byCategory[e.category] = [];
            byCategory[e.category].push(e);
        });
        
        modalContent.innerHTML = Object.keys(byCategory).map(category => {
            const categoryExpenses = byCategory[category];
            const categoryTotal = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
            
            return `
                <div class="mb-6">
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="text-lg font-bold text-gray-900 dark:text-white">${category}</h4>
                        <span class="text-lg font-bold text-indigo-600 dark:text-indigo-400">R$ ${categoryTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div class="space-y-2">
                        ${categoryExpenses.map(e => `
                            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                                <span class="text-gray-900 dark:text-white font-medium">${e.description}</span>
                                <div class="flex items-center gap-3">
                                    <span class="text-gray-900 dark:text-white font-bold">R$ ${e.amount.toFixed(2).replace('.', ',')}</span>
                                    <button onclick="deleteExpenseFromModal('${e.id}')" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 font-bold">✕</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    document.getElementById('dayModal').classList.remove('hidden');
};

window.closeDayModal = () => document.getElementById('dayModal').classList.add('hidden');

window.deleteExpenseFromModal = async function(id) {
    if (confirm('Deseja realmente excluir este gasto?')) {
        const result = await deleteExpenseFromDB(id);
        
        if (result.success) {
            expenses = expenses.filter(e => e.id !== id);
            
            const currentDateText = document.getElementById('modalDayTitle').textContent;
            const dateMatch = currentDateText.match(/(\d+) de (\w+) de (\d+)/);
            if (dateMatch) {
                const months = {
                    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
                    'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
                    'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
                };
                const day = dateMatch[1].padStart(2, '0');
                const month = months[dateMatch[2]];
                const year = dateMatch[3];
                const dateStr = `${year}-${month}-${day}`;
                showDayExpenses(dateStr);
            }
            
            updateAll();
        } else {
            alert('Erro ao deletar gasto.');
        }
    }
};

document.getElementById('dayModal').addEventListener('click', function(e) {
    if (e.target === this) closeDayModal();
});

// ===== LISTA DE GASTOS =====
function updateExpenseList() {
    const list = document.getElementById('expenseList');
    
    if (expenses.length === 0) {
        list.innerHTML = `
            <div class="text-center py-12">
                <p class="text-gray-600 dark:text-gray-300 text-lg font-semibold mb-2">Nenhum gasto cadastrado ainda</p>
                <p class="text-gray-500 dark:text-gray-400 text-sm">Adicione seu primeiro gasto acima!</p>
            </div>
        `;
        return;
    }
    
    const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    list.innerHTML = sorted.map(e => `
        <div class="border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4 flex justify-between items-center hover:bg-indigo-50 dark:hover:bg-indigo-900/30 bg-white dark:bg-gray-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
            <div class="flex-1">
                <div class="font-bold text-gray-900 dark:text-white text-lg">${e.description}</div>
                <div class="text-sm text-gray-700 dark:text-gray-300 mt-1 font-medium">
                    <span class="bg-indigo-100 dark:bg-indigo-900 px-3 py-1 rounded-lg text-gray-900 dark:text-white">${e.category}</span>
                    <span class="ml-2 text-gray-600 dark:text-gray-300">${new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <span class="font-bold text-2xl text-red-700 dark:text-red-300">R$ ${e.amount.toFixed(2).replace('.', ',')}</span>
                <button onclick="deleteExpense('${e.id}')" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-xl transition-all duration-300 hover:scale-125 font-bold">✕</button>
            </div>
        </div>
    `).join('');
}

// ===== ATUALIZAR TUDO =====
function updateAll() {
    updateSummary();
    updateBudgetDisplay();
    updateCategoryChart();
    updateDailyChart();
    updateCalendar();
    updateExpenseList();
}

// ===== INICIALIZAÇÃO =====
window.addEventListener('DOMContentLoaded', async function() {
    console.log('=== INICIALIZANDO APLICAÇÃO ===');
    
    if (!checkAuth()) return;
    
    // Atualizar sidebar com dados do usuário
    document.getElementById('sidebarUserName').textContent = currentUser.name;
    document.getElementById('sidebarUserEmail').textContent = currentUser.email;
    
    initDarkMode();
    
    const today = new Date();
    document.getElementById('date').value = today.toISOString().split('T')[0];
    
    await loadExpensesFromDB();
    await loadBudgetFromDB();
    
    updateAll();
    
    // Fechar sidebar em mobile ao clicar fora
    const sidebar = document.getElementById('sidebar');
    document.addEventListener('click', function(e) {
        if (window.innerWidth < 1024) {
            if (!sidebar.contains(e.target) && !e.target.closest('button[onclick="toggleSidebar()"]')) {
                sidebar.classList.add('-translate-x-full');
            }
        }
    });
    
    console.log('=== APLICAÇÃO PRONTA ===');
    console.log('Usuário:', currentUser);
    console.log('Gastos:', expenses);
});