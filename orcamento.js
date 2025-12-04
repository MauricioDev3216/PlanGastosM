// orcamento.js

const SUPABASE_URL = 'https://qqxttxwxrakhbpzyubsc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeHR0eHd4cmFraGJwenl1YnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTg1MzMsImV4cCI6MjA4MDI3NDUzM30.naV_3GuPkuq1FandcZPYhSNzXLLlV9dCEc0Lf2AXiYo';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let expenses = [];
let totalBudget = 0;
let budgetChart = null;

const categories = ['Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Moradia', 'Outros'];

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

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
}

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
    updateBudgetChart();
}

function initDarkMode() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') {
        document.documentElement.classList.add('dark');
        document.getElementById('moonIconSidebar').classList.add('hidden');
        document.getElementById('sunIconSidebar').classList.remove('hidden');
        document.getElementById('darkModeText').textContent = 'Modo Claro';
    }
}

async function loadExpenses() {
    try {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', currentUser.id);

        if (error) throw error;

        expenses = data.map(expense => ({
            id: expense.id,
            description: expense.description,
            amount: parseFloat(expense.amount),
            category: expense.category,
            date: expense.date
        }));
    } catch (error) {
        console.error('Erro ao carregar gastos:', error);
    }
}

async function loadBudget() {
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
            totalBudget = parseFloat(data.amount);
        }
    } catch (error) {
        console.error('Erro ao carregar orçamento:', error);
    }
}

async function setTotalBudget() {
    const input = document.getElementById('totalBudgetInput');
    const value = parseFloat(input.value);
    
    if (isNaN(value) || value <= 0) {
        alert('Por favor, digite um valor válido!');
        return;
    }

    try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const { error } = await supabase
            .from('budgets')
            .upsert([{
                user_id: currentUser.id,
                amount: value,
                month: month,
                year: year
            }], {
                onConflict: 'user_id,month,year'
            });

        if (error) throw error;

        totalBudget = value;
        input.value = '';
        updateTotalBudget();
        loadBudgetHistory();
        
        alert('Orçamento definido com sucesso!');
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao salvar orçamento.');
    }
}

function updateTotalBudget() {
    const now = new Date();
    const monthExpenses = expenses.filter(e => {
        const date = new Date(e.date + 'T00:00:00');
        return date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear();
    });

    const spent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = totalBudget - spent;
    const percentage = totalBudget > 0 ? Math.min((spent / totalBudget) * 100, 100) : 0;

    document.getElementById('totalBudget').textContent = `R$ ${totalBudget.toFixed(2).replace('.', ',')}`;
    document.getElementById('totalSpent').textContent = `R$ ${spent.toFixed(2).replace('.', ',')}`;
    document.getElementById('totalRemaining').textContent = `R$ ${remaining.toFixed(2).replace('.', ',')}`;

    const bar = document.getElementById('totalProgressBar');
    const text = document.getElementById('totalProgressText');
    const status = document.getElementById('totalProgressStatus');

    bar.style.width = `${percentage}%`;
    text.textContent = `${percentage.toFixed(1)}%`;

    if (percentage >= 100) {
        bar.className = 'h-full bg-gradient-to-r from-red-600 to-red-700 transition-all duration-500 flex items-center justify-center text-white font-bold';
        status.textContent = '⚠️ Orçamento excedido!';
        status.className = 'text-sm text-red-600 dark:text-red-400 text-center font-bold';
    } else if (percentage >= 80) {
        bar.className = 'h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 flex items-center justify-center text-white font-bold';
        status.textContent = '⚠️ Atenção! Mais de 80% do orçamento gasto';
        status.className = 'text-sm text-orange-600 dark:text-orange-400 text-center font-semibold';
    } else if (percentage >= 50) {
        bar.className = 'h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500 flex items-center justify-center text-white font-bold';
        status.textContent = `Você gastou ${percentage.toFixed(1)}% do orçamento`;
        status.className = 'text-sm text-gray-600 dark:text-gray-300 text-center font-medium';
    } else {
        bar.className = 'h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500 flex items-center justify-center text-white font-bold';
        status.textContent = `✓ ${(100 - percentage).toFixed(1)}% do orçamento disponível`;
        status.className = 'text-sm text-green-600 dark:text-green-400 text-center font-semibold';
    }

    updateBudgetChart();
}

function updateBudgetChart() {
    const now = new Date();
    const monthExpenses = expenses.filter(e => {
        const date = new Date(e.date + 'T00:00:00');
        return date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear();
    });

    const spent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = Math.max(totalBudget - spent, 0);

    const ctx = document.getElementById('budgetChart');
    const isDark = document.documentElement.classList.contains('dark');

    if (budgetChart) budgetChart.destroy();

    budgetChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Gasto', 'Disponível'],
            datasets: [{
                data: [spent, remaining],
                backgroundColor: ['#EF4444', '#10B981'],
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
                        font: { size: 12, weight: 'bold' }
                    }
                }
            }
        }
    });
}

function updateCategoryBudgets() {
    const now = new Date();
    const monthExpenses = expenses.filter(e => {
        const date = new Date(e.date + 'T00:00:00');
        return date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear();
    });

    const categoryExpenses = {};
    categories.forEach(cat => categoryExpenses[cat] = 0);
    monthExpenses.forEach(e => {
        categoryExpenses[e.category] = (categoryExpenses[e.category] || 0) + e.amount;
    });

    const container = document.getElementById('categoryBudgets');
    const suggestedBudget = totalBudget / categories.length;

    container.innerHTML = categories.map(category => {
        const spent = categoryExpenses[category];
        const suggested = suggestedBudget;
        const percentage = suggested > 0 ? (spent / suggested) * 100 : 0;

        return `
            <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">${category}</h3>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                        Sugerido: R$ ${suggested.toFixed(2).replace('.', ',')}
                    </span>
                </div>
                
                <div class="flex justify-between items-center mb-2">
                    <span class="text-2xl font-bold text-red-600 dark:text-red-400">
                        R$ ${spent.toFixed(2).replace('.', ',')}
                    </span>
                    <span class="text-lg font-semibold ${percentage > 100 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}">
                        ${percentage.toFixed(1)}%
                    </span>
                </div>
                
                <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div class="h-full rounded-full transition-all duration-500 ${
                        percentage > 100 ? 'bg-red-600' : 
                        percentage > 80 ? 'bg-orange-500' : 
                        percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

async function loadBudgetHistory() {
    try {
        const { data, error } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('year', { ascending: false })
            .order('month', { ascending: false })
            .limit(12);

        if (error) throw error;

        const tbody = document.getElementById('budgetHistory');
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-8 text-gray-600 dark:text-gray-400">
                        Nenhum histórico de orçamento ainda
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = await Promise.all(data.map(async (budget) => {
            const monthName = new Date(budget.year, budget.month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            
            // Buscar gastos daquele mês
            const { data: monthExpenses } = await supabase
                .from('expenses')
                .select('amount')
                .eq('user_id', currentUser.id)
                .gte('date', `${budget.year}-${String(budget.month).padStart(2, '0')}-01`)
                .lt('date', `${budget.month === 12 ? budget.year + 1 : budget.year}-${String(budget.month === 12 ? 1 : budget.month + 1).padStart(2, '0')}-01`);

            const spent = monthExpenses ? monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0) : 0;
            const diff = budget.amount - spent;

            return `
                <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td class="py-3 px-4 text-gray-900 dark:text-white font-semibold capitalize">${monthName}</td>
                    <td class="py-3 px-4 text-right text-gray-900 dark:text-white">R$ ${parseFloat(budget.amount).toFixed(2).replace('.', ',')}</td>
                    <td class="py-3 px-4 text-right text-gray-900 dark:text-white">R$ ${spent.toFixed(2).replace('.', ',')}</td>
                    <td class="py-3 px-4 text-right font-bold ${diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                        R$ ${Math.abs(diff).toFixed(2).replace('.', ',')}
                    </td>
                    <td class="py-3 px-4 text-center">
                        ${diff >= 0 
                            ? '<span class="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-bold">✓ No limite</span>'
                            : '<span class="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-1 rounded-full text-sm font-bold">✗ Excedido</span>'
                        }
                    </td>
                </tr>
            `;
        })).then(rows => rows.join(''));

    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    }
}

window.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    document.getElementById('sidebarUserName').textContent = currentUser.name;
    document.getElementById('sidebarUserEmail').textContent = currentUser.email;
    
    initDarkMode();
    await loadExpenses();
    await loadBudget();
    updateTotalBudget();
    updateCategoryBudgets();
    loadBudgetHistory();
});