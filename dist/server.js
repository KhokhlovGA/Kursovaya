"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const path_1 = __importDefault(require("path"));
const body_parser_1 = __importDefault(require("body-parser"));
const WEATHER_API_KEY = '';
const GEOCODER_API_KEY = '';
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.static('public'));
app.use(body_parser_1.default.json());
class WeatherDataFetcher {
    static getCoordinates(city) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(`https://geocode-maps.yandex.ru/1.x/?apikey=${GEOCODER_API_KEY}&format=json&geocode=${encodeURIComponent(city)}`);
                const coordinates = response.data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos.split(' ');
                return {
                    latitude: parseFloat(coordinates[1]),
                    longitude: parseFloat(coordinates[0])
                };
            }
            catch (error) {
                console.error('Ошибка при получении координат города:', error);
                throw error;
            }
        });
    }
    static fetchDailyForecast(latitude, longitude) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const url = `https://api.weather.yandex.ru/v2/forecast?lat=${latitude}&lon=${longitude}&lang=ru_RU&extra=true`;
                const response = yield axios_1.default.get(url, {
                    headers: {
                        'X-Yandex-API-Key': WEATHER_API_KEY
                    }
                });
                const forecastData = response.data.forecasts.map((forecast) => ({
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
                    hourly: forecast.hours.map((hour) => ({
                        time: hour.hour,
                        temperature: hour.temp,
                        humidity: hour.humidity,
                        precipitation: hour.prec_mm
                    }))
                }));
                return forecastData;
            }
            catch (error) {
                console.error('Произошла ошибка при получении прогноза погоды:', error);
                throw error;
            }
        });
    }
}
app.get('/weather', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const city = req.query.city;
    try {
        const coordinates = yield WeatherDataFetcher.getCoordinates(city);
        const dailyForecast = yield WeatherDataFetcher.fetchDailyForecast(coordinates.latitude, coordinates.longitude);
        res.json(dailyForecast);
    }
    catch (error) {
        res.status(500).send('Произошла ошибка при получении данных о погоде');
    }
}));
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
});
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
