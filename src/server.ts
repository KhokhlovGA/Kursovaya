import express, { Request, Response } from 'express';
import axios from 'axios';
import path from 'path';
import bodyParser from 'body-parser';

const WEATHER_API_KEY = 'f09b8857-b181-4484-8eca-8bf02e0944da';
const GEOCODER_API_KEY = '642912bb-517d-4eaf-bb57-4660059039cd';

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(bodyParser.json());

interface HourlyForecastData {
    time: string;
    temperature: number;
    humidity: number;
    precipitation: number;
}

interface DailyForecastData {
    date: string;
    sunriseTime: string;
    sunsetTime: string;
    morning: HourlyForecastData;
    day: HourlyForecastData;
    evening: HourlyForecastData;
    night: HourlyForecastData;
    hourly: HourlyForecastData[];
}

class WeatherDataFetcher {
    static async getCoordinates(city: string): Promise<{ latitude: number; longitude: number }> {
        try {
            const response = await axios.get(`https://geocode-maps.yandex.ru/1.x/?apikey=${GEOCODER_API_KEY}&format=json&geocode=${encodeURIComponent(city)}`);
            const coordinates = response.data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos.split(' ');
            return {
                latitude: parseFloat(coordinates[1]),
                longitude: parseFloat(coordinates[0])
            };
        } catch (error) {
            console.error('Ошибка при получении координат города:', error);
            throw error;
        }
    }

    static async fetchDailyForecast(latitude: number, longitude: number): Promise<DailyForecastData[]> {
        try {
            const url = `https://api.weather.yandex.ru/v2/forecast?lat=${latitude}&lon=${longitude}&lang=ru_RU&extra=true`;
            const response = await axios.get(url, {
                headers: {
                    'X-Yandex-API-Key': WEATHER_API_KEY
                }
            });
            const forecastData = response.data.forecasts.map((forecast: any) => ({
                date: forecast.date,
                sunriseTime: forecast.sunrise,
                sunsetTime: forecast.sunset,
                morning: {
                    time: "06:00",
                    temperature: forecast.parts.morning.temp_avg,
                    humidity: forecast.parts.morning.humidity,
                    precipitation: forecast.parts.morning.prec_mm
                },
                day: {
                    time: "12:00",
                    temperature: forecast.parts.day.temp_avg,
                    humidity: forecast.parts.day.humidity,
                    precipitation: forecast.parts.day.prec_mm
                },
                evening: {
                    time: "18:00",
                    temperature: forecast.parts.evening.temp_avg,
                    humidity: forecast.parts.evening.humidity,
                    precipitation: forecast.parts.evening.prec_mm
                },
                night: {
                    time: "00:00",
                    temperature: forecast.parts.night.temp_avg,
                    humidity: forecast.parts.night.humidity,
                    precipitation: forecast.parts.night.prec_mm
                },
                hourly: forecast.hours.map((hour: any) => ({
                    time: hour.hour,
                    temperature: hour.temp,
                    humidity: hour.humidity,
                    precipitation: hour.prec_mm
                }))
            }));
            return forecastData;
        } catch (error) {
            console.error('Произошла ошибка при получении прогноза погоды:', error);
            throw error;
        }
    }
}

app.get('/weather', async (req: Request, res: Response) => {
    const city = req.query.city as string;
    try {
        const coordinates = await WeatherDataFetcher.getCoordinates(city);
        const dailyForecast = await WeatherDataFetcher.fetchDailyForecast(coordinates.latitude, coordinates.longitude);
        res.json(dailyForecast);
    } catch (error) {
        res.status(500).send('Произошла ошибка при получении данных о погоде');
    }
});

app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});