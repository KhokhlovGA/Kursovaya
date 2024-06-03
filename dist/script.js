document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('city-form');
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const weatherDataDiv = document.getElementById('weather-data');
    const weatherTableBody = document.getElementById('weather-table-body');
    const temperatureChartCanvas = document.getElementById('temperatureChart').getContext('2d');
    const precipitationChartCanvas = document.getElementById('precipitationChart').getContext('2d');

    let temperatureChart;
    let precipitationChart;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const city = document.getElementById('city-input').value;

        if (loading) loading.style.display = 'block';
        if (errorDiv) errorDiv.textContent = '';
        if (weatherDataDiv) weatherDataDiv.style.display = 'none';
        if (weatherTableBody) weatherTableBody.innerHTML = '';

        try {
            const response = await fetch(`/weather?city=${city}`);
            if (!response.ok) {
                throw new Error('Ошибка при получении данных о погоде');
            }
            const data = await response.json();
            const processedData = data.map((day) => ({
                date: day.date,
                sunriseTime: day.sunriseTime,
                sunsetTime: day.sunsetTime,
                morning: day.morning.temperature,
                day: day.day.temperature,
                evening: day.evening.temperature,
                night: day.night.temperature,
                hourly: day.hourly
            }));
            displayWeatherData(processedData);
            if (weatherDataDiv) weatherDataDiv.style.display = 'block';
        } catch (error) {
            if (errorDiv) errorDiv.textContent = error.message;
        } finally {
            if (loading) loading.style.display = 'none';
        }
    });

    function displayWeatherData(data) {
        if (!weatherTableBody) return;

        data.forEach((day) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${day.date}</td>
                <td>${day.sunriseTime}</td>
                <td>${day.sunsetTime}</td>
                <td>${day.morning} °C</td>
                <td>${day.day} °C</td>
                <td>${day.evening} °C</td>
                <td>${day.night} °C</td>
            `;
            weatherTableBody.appendChild(row);
        });

        const hourlyData = data.map(day => day.hourly).flat();
        const labels = hourlyData.map(hour => hour.time);
        const temperatureData = hourlyData.map(hour => hour.temperature);
        const precipitationData = hourlyData.map(hour => hour.precipitation);

        if (temperatureChart) temperatureChart.destroy();
        temperatureChart = new Chart(temperatureChartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Температура (°C)',
                    data: temperatureData,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        if (precipitationChart) precipitationChart.destroy();
        precipitationChart = new Chart(precipitationChartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Осадки (мм)',
                    data: precipitationData,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
});