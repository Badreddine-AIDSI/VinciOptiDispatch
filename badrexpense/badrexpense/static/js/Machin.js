document.addEventListener("DOMContentLoaded", function () {
    // Fetch and render the machine downtime chart
    fetch('/machine-downtime-summary/')
        .then(response => response.json())
        .then(data => {
            const machineNames = Object.keys(data.machine_downtime_data);
            const downtimeDurations = Object.values(data.machine_downtime_data);

            const ctx1 = document.getElementById('machineDowntimeChart').getContext('2d');
            new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: machineNames,
                    datasets: [{
                        label: 'Downtime Duration (hours)',
                        data: downtimeDurations,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Hours'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Machine Names'
                            }
                        }
                    }
                }
            });
        });

    // Fetch and render the category breakdown frequency chart
    fetch('/category-breakdown-frequency/')
        .then(response => response.json())
        .then(data => {
            const categories = Object.keys(data.category_breakdown_data);
            const frequencies = Object.values(data.category_breakdown_data);

            const ctx2 = document.getElementById('categoryFrequencyChart').getContext('2d');
            new Chart(ctx2, {
                type: 'pie',
                data: {
                    labels: categories,
                    datasets: [{
                        label: 'Breakdown Frequency',
                        data: frequencies,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(153, 102, 255, 0.6)',
                            'rgba(255, 159, 64, 0.6)'
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
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Breakdown Frequency by Category'
                        }
                    }
                }
            });
        });
});
