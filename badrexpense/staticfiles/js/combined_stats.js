// Function to render the income chart
const renderIncomeChart = (data, labels) => {
    var ctx = document.getElementById('myChart1').getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'doughnut', // Specify the type of chart: 'bar', 'pie', 'doughnut', etc.
        data: {
            labels: labels,
            datasets: [{
                label: "Last Year's Incomes by Source",
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            title: {
                display: false,
                text: 'Incomes by Source',
            },
            maintainAspectRatio: false, // Allows custom sizing
            responsive: true // Ensures the chart is responsive
        }
    });
}

// Function to fetch data for the income chart
const getIncomeChartData = () => {
    console.log("Fetching income data");
    fetch('/income-source-summary')
        .then(res => {
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            return res.json();
        })
        .then(results => {
            console.log('Income results', results);
            const source_data = results.income_source_data;
            const [labels, data] = [Object.keys(source_data), Object.values(source_data)];
            renderIncomeChart(data, labels);
        })
        .catch(error => console.error('Error fetching the income data:', error));
}

// Function to render the expense chart
const renderExpenseChart = (data, labels) => {
    var ctx = document.getElementById('myChart2').getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'bar', // Specify the type of chart
        data: {
            labels: labels,
            datasets: [{
                label: "Last Year's Expenses",
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            title: {
                display: false,
                text: 'Expenses by Category',
            },
            maintainAspectRatio: false, // Allows custom sizing
            responsive: true // Ensures the chart is responsive
        }
    });
}

// Function to fetch data for the expense chart
const getExpenseChartData = () => {
    console.log("Fetching expense data");
    fetch('/expense-category-summary')
        .then(res => {
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            return res.json();
        })
        .then(results => {
            console.log('Expense results', results);
            const category_data = results.expense_category_data;
            const [labels, data] = [Object.keys(category_data), Object.values(category_data)];
            renderExpenseChart(data, labels);
        })
        .catch(error => console.error('Error fetching the expense data:', error));
}

// Execute both data fetching functions when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    getIncomeChartData();
    getExpenseChartData();
});
