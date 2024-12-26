const API_URL = 'https://api.bybit.com/v5/market/tickers'; // Используем API версии 5

let currentSortColumn = null;
let isAscending = true;

// Функция для получения данных
async function fetchFundingData() {
    try {
        const response = await fetch(`${API_URL}?category=linear`);
        const data = await response.json();

        if (data.retMsg !== 'OK') {
            console.error('API Error:', data.retMsg);
            return [];
        }

        return data.result.list.map(item => ({
            symbol: item.symbol,
            lastPrice: parseFloat(item.lastPrice),
            fundingRate: parseFloat(item.fundingRate) * 100 // Преобразуем в проценты
        }));
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

// Рендеринг таблицы
function renderTable(data) {
    const tableBody = document.querySelector('#fundingTable tbody');
    tableBody.innerHTML = '';
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="symbol">${item.symbol.replace(/([A-Z]+)(USDT|BTC|ETH)$/, '$1 / $2')}</td>
            <td>${item.lastPrice}</td>
            <td class="${item.fundingRate >= 0 ? 'positive' : 'negative'}">${item.fundingRate.toFixed(7)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Фильтрация данных
function applyFilters(data) {
    const filterValue = document.querySelector('#filter').value.toLowerCase();
    const fundingThreshold = parseFloat(document.querySelector('#funding-filter').value || 0.11);

    return data.filter(item => {
        const matchesSymbol = item.symbol.toLowerCase().includes(filterValue);
        const matchesFunding = Math.abs(item.fundingRate) >= fundingThreshold;
        return matchesSymbol && matchesFunding;
    });
}

// Сортировка данных
function sortData(data, column) {
    return data.sort((a, b) => {
        const valueA = a[column];
        const valueB = b[column];

        if (valueA < valueB) return isAscending ? -1 : 1;
        if (valueA > valueB) return isAscending ? 1 : -1;
        return 0;
    });
}

// Обновление таблицы
async function updateTable() {
    let data = await fetchFundingData();
    data = applyFilters(data);

    if (currentSortColumn) {
        data = sortData(data, currentSortColumn);
    }

    renderTable(data);
}

// Установка обработчиков для заголовков таблицы
document.querySelectorAll('#fundingTable th').forEach((header, index) => {
    header.addEventListener('click', () => {
        const columns = ['symbol', 'lastPrice', 'fundingRate'];
        const column = columns[index];

        if (currentSortColumn === column) {
            isAscending = !isAscending;
        } else {
            currentSortColumn = column;
            isAscending = true;
        }

        updateTable();
    });
});

// Обработчики для фильтров
document.querySelector('#filter').addEventListener('input', updateTable);
document.querySelector('#funding-filter').addEventListener('input', updateTable);

// Инициализация
updateTable();
setInterval(updateTable, 5000); // Обновление каждые 5 секунд
