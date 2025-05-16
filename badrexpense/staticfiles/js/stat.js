const renderChart = (data, labels) => {
    var ctx = document.getElementById('myChart').getContext('2d');
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
                display: true,
                text: 'Incomes by Source',
            },
            maintainAspectRatio: false, // Allows custom sizing
            responsive: true // Ensures the chart is responsive
        }
    });
}

const getChartData = () => {
    console.log("fetching");
    fetch('/income-source-summary')
        .then(res => {
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            return res.json();
        })
        .then(results => {
            console.log('results', results);
            const source_data = results.income_source_data;
            const [labels, data] = [Object.keys(source_data), Object.values(source_data)];
            renderChart(data, labels);
        })
        .catch(error => console.error('Error fetching the data:', error));
}

document.addEventListener('DOMContentLoaded', function() {
    getChartData();
});
