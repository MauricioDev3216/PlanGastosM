// calendario.js

const SUPABASE_URL = 'https://qqxttxwxrakhbpzyubsc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeHR0eHd4cmFraGJwenl1YnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTg1MzMsImV4cCI6MjA4MDI3NDUzM30.naV_3GuPkuq1FandcZPYhSNzXLLlV9dCEc0Lf2AXiYo';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let expenses = [];
let currentDate = new Date();
let selectedDate = null;

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

function updateMonthStats() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthExpenses = expenses.filter(e => {
        const date = new Date(e.date + 'T00:00:00');
        return date.getMonth() === month && date.getFullYear() === year;
    });

    const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const daysWithExpenses = new Set(monthExpenses.map(e => e.date)).size;
    
    const avgPerDay = daysWithExpenses > 0 ? total / daysWithExpenses : 0;
    
    const dailyTotals = {};
    monthExpenses.forEach(e => {
        dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.amount;
    });
    const maxDay = Math.max(...Object.values(dailyTotals), 0);

    document.getElementById('monthTotal').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    document.getElementById('daysWithExpenses').textContent = daysWithExpenses;
    document.getElementById('avgPerDay').textContent = `R$ ${avgPerDay.toFixed(2).replace('.', ',')}`;
    document.getElementById('maxDay').textContent = `R$ ${maxDay.toFixed(2).replace('.', ',')}`;
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('currentMonth').textContent = 
        currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    // Dias vazios
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'aspect-square';
        calendarDays.appendChild(emptyDay);
    }

    const today = new Date();
    const isDark = document.documentElement.classList.contains('dark');

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayExpenses = expenses.filter(e => e.date === dateStr);
        const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        const isToday = today.getDate() === day && 
                       today.getMonth() === month && 
                       today.getFullYear() === year;

        const dayDiv = document.createElement('div');
        dayDiv.className = `aspect-square p-3 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
            isToday 
                ? 'bg-indigo-600 dark:bg-indigo-700 text-white border-4 border-indigo-800 dark:border-indigo-400' 
                : total > 0
                    ? 'bg-red-100 dark:bg-red-900/40 border-2 border-red-400 dark:border-red-600'
                    : 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
        }`;
        
        dayDiv.onclick = () => selectDay(dateStr);
        
        dayDiv.innerHTML = `
            <div class="h-full flex flex-col justify-between">
                <div class="text-right font-bold text-lg ${isToday ? 'text-white' : total > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}">
                    ${day}
                </div>
                ${total > 0 ? `
                    <div class="mt-2">
                        <div class="text-xs font-semibold ${isToday ? 'text-white' : 'text-red-700 dark:text-red-300'} mb-1">
                            ${dayExpenses.length} gasto${dayExpenses.length > 1 ? 's' : ''}
                        </div>
                        <div class="font-bold text-sm ${isToday ? 'text-white' : 'text-red-600 dark:text-red-400'}">
                            R$ ${total.toFixed(2).replace('.', ',')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        calendarDays.appendChild(dayDiv);
    }

    updateMonthStats();
}

function selectDay(dateStr) {
    selectedDate = dateStr;
    const dayExpenses = expenses.filter(e => e.date === dateStr);
    
    const date = new Date(dateStr + 'T00:00:00');
    const formattedDate = date.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    
    document.getElementById('selectedDate').textContent = formattedDate;
    
    // Mostrar painel de adicionar
    document.getElementById('quickAddPanel').classList.remove('hidden');
    document.getElementById('quickDate').value = dateStr;
    
    // Mostrar gastos do dia
    const dayExpensesDiv = document.getElementById('dayExpenses');
    const dayExpensesList = document.getElementById('dayExpensesList');
    
    if (dayExpenses.length === 0) {
        dayExpensesList.innerHTML = `
            <p class="text-center text-gray-600 dark:text-gray-400 py-8">
                Nenhum gasto neste dia. Use o formulário acima para adicionar!
            </p>
        `;
    } else {
        dayExpensesList.innerHTML = dayExpenses.map(e => `
            <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 flex justify-between items-center">
                <div>
                    <p class="font-bold text-gray-900 dark:text-white text-lg">${e.description}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">${e.category}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold text-xl text-red-600 dark:text-red-400">R$ ${e.amount.toFixed(2).replace('.', ',')}</p>
                    <button onclick="deleteExpense('${e.id}')" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-sm font-semibold mt-1">
                        Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    dayExpensesDiv.classList.remove('hidden');
    dayExpensesDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeQuickAdd() {
    document.getElementById('quickAddPanel').classList.add('hidden');
    document.getElementById('dayExpenses').classList.add('hidden');
    selectedDate = null;
}

document.getElementById('quickAddForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const expense = {
        description: document.getElementById('quickDescription').value.trim(),
        amount: parseFloat(document.getElementById('quickAmount').value),
        category: document.getElementById('quickCategory').value,
        date: document.getElementById('quickDate').value
    };

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

        expenses.push({
            id: data.id,
            ...expense
        });

        this.reset();
        renderCalendar();
        selectDay(expense.date);
        
        alert('Gasto adicionado com sucesso!');
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao adicionar gasto.');
    }
});

async function deleteExpense(id) {
    if (!confirm('Deseja realmente excluir este gasto?')) return;

    try {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        expenses = expenses.filter(e => e.id !== id);
        renderCalendar();
        
        if (selectedDate) {
            selectDay(selectedDate);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao deletar gasto.');
    }
}

function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    closeQuickAdd();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    closeQuickAdd();
}

window.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    document.getElementById('sidebarUserName').textContent = currentUser.name;
    document.getElementById('sidebarUserEmail').textContent = currentUser.email;
    
    initDarkMode();
    await loadExpenses();
    renderCalendar();
});