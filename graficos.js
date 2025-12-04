// graficos.js - Cole na mesma pasta dos HTMLs

const SUPABASE_URL = 'https://qqxttxwxrakhbpzyubsc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeHR0eHd4cmFraGJwenl1YnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTg1MzMsImV4cCI6MjA4MDI3NDUzM30.naV_3GuPkuq1FandcZPYhSNzXLLlV9dCEc0Lf2AXiYo';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let expenses = [];
let categoryChart, monthlyChart, dailyChart, weeklyChart;

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
    updateAllCharts();
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

function updateStatistics() {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    document.getElementById('totalGastos').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    
    // Categoria maior
    const categories = {};
    expenses.forEach(e => {
        categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    
    const maxCategory = Object.keys(categories).reduce((a, b) => 
        categories[a] > categories[b] ? a : b, Object.keys(categories)[0]);
    
    if (maxCategory) {
        document.getElementById('categoriaMaior').textContent = maxCategory;
        document.getElementById('categoriaMaiorValor').textContent = 
            `R$ ${categories[maxCategory].toFixed(2).replace('.', ',')} (${((categories[maxCategory]/total)*100).toFixed(1)}%)`;
    }
    
    // Média por dia
    const uniqueDays = [...new Set(expenses.map(e => e.date))].length;
    const media = uniqueDays > 0 ? total / uniqueDays : 0;
    document.getElementById('mediaDia').textContent = `R$ ${media.toFixed(2).replace('.', ',')}`;
    
    // Total de itens
    document.getElementById('totalItens').textContent = expenses.length;
}

function createCategoryChart() {
    const categories = {};
    expenses.forEach(e => {
        categories[e.category] = (categories[e.category] || 0) + e.amount;
    });

    const total = Object.values(categories).reduce((sum, val) => sum + val, 0);
    const ctx = document.getElementById('categoryChart');
    const isDark = document.documentElement.classList.contains('dark');
    
    if (categoryChart) categoryChart.destroy();

    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'];

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: colors,
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
                        font: { size: 14, weight: 'bold' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: R$ ${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Criar lista de categorias com percentual
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount], index) => {
            const percentage = ((amount / total) * 100).toFixed(1);
            return `
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div class="flex items-center gap-3">
                        <div class="w-4 h-4 rounded-full" style="background-color: ${colors[index]}"></div>
                        <span class="font-semibold text-gray-900 dark:text-white">${category}</span>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-gray-900 dark:text-white">R$ ${amount.toFixed(2).replace('.', ',')}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">${percentage}%</p>
                    </div>
                </div>
            `;
        }).join('');
}

function createMonthlyChart() {
    const monthlyData = {};
    
    expenses.forEach(e => {
        const month = new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
        monthlyData[month] = (monthlyData[month] || 0) + e.amount;
    });

    const months = Object.keys(monthlyData).sort();
    const values = months.map(m => monthlyData[m]);

    const ctx = document.getElementById('monthlyChart');
    const isDark = document.documentElement.classList.contains('dark');
    
    if (monthlyChart) monthlyChart.destroy();

    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Gastos (R$)',
                data: values,
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: isDark ? '#F9FAFB' : '#111827',
                        font: { size: 14, weight: 'bold' }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: isDark ? '#F9FAFB' : '#111827',
                        callback: value => 'R$ ' + value.toFixed(0)
                    },
                    grid: { color: isDark ? '#374151' : '#E5E7EB' }
                },
                x: {
                    ticks: { color: isDark ? '#F9FAFB' : '#111827' },
                    grid: { display: false }
                }
            }
        }
    });
}

function createDailyChart() {
    const last30Days = [];
    const dailyExpenses = {};

    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        last30Days.push(dateStr);
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
            labels: last30Days.map(d => {
                const date = new Date(d + 'T00:00:00');
                return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            }),
            datasets: [{
                label: 'Gastos (R$)',
                data: last30Days.map(d => dailyExpenses[d]),
                backgroundColor: '#6366F1',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: isDark ? '#F9FAFB' : '#111827',
                        font: { size: 14, weight: 'bold' }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: isDark ? '#F9FAFB' : '#111827',
                        callback: value => 'R$ ' + value.toFixed(0)
                    },
                    grid: { color: isDark ? '#374151' : '#E5E7EB' }
                },
                x: {
                    ticks: { color: isDark ? '#F9FAFB' : '#111827' },
                    grid: { display: false }
                }
            }
        }
    });
}

function createWeeklyChart() {
    const weeklyData = [0, 0, 0, 0]; // Últimas 4 semanas

    expenses.forEach(e => {
        const expenseDate = new Date(e.date + 'T00:00:00');
        const today = new Date();
        const diffDays = Math.floor((today - expenseDate) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(diffDays / 7);
        
        if (weekIndex < 4) {
            weeklyData[3 - weekIndex] += e.amount;
        }
    });

    const ctx = document.getElementById('weeklyChart');
    const isDark = document.documentElement.classList.contains('dark');
    
    if (weeklyChart) weeklyChart.destroy();

    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Há 4 semanas', 'Há 3 semanas', 'Há 2 semanas', 'Semana atual'],
            datasets: [{
                label: 'Gastos (R$)',
                data: weeklyData,
                backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: isDark ? '#F9FAFB' : '#111827',
                        font: { size: 14, weight: 'bold' }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: isDark ? '#F9FAFB' : '#111827',
                        callback: value => 'R$ ' + value.toFixed(0)
                    },
                    grid: { color: isDark ? '#374151' : '#E5E7EB' }
                },
                x: {
                    ticks: { color: isDark ? '#F9FAFB' : '#111827' },
                    grid: { display: false }
                }
            }
        }
    });
}

function updateTopExpenses() {
    const top5 = [...expenses]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    const container = document.getElementById('topExpenses');
    container.innerHTML = top5.map((e, index) => `
        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <span class="text-indigo-600 dark:text-indigo-300 font-bold text-lg">${index + 1}</span>
                </div>
                <div>
                    <p class="font-bold text-gray-900 dark:text-white">${e.description}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">${e.category} • ${new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
            </div>
            <p class="text-xl font-bold text-red-600 dark:text-red-400">R$ ${e.amount.toFixed(2).replace('.', ',')}</p>
        </div>
    `).join('');
}

function updateAllCharts() {
    createCategoryChart();
    createMonthlyChart();
    createDailyChart();
    createWeeklyChart();
}

window.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    document.getElementById('sidebarUserName').textContent = currentUser.name;
    document.getElementById('sidebarUserEmail').textContent = currentUser.email;
    
    initDarkMode();
    
    await loadExpenses();
    updateStatistics();
    updateAllCharts();
    updateTopExpenses();
});