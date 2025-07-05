import axios from "axios";


export interface CurrentWeather {
  location: {
    name: string;
    lat: number;
    lon: number;
    country: string;
  };
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    visibility: number;
    uvIndex: number;
    weather: {
      main: string;
      description: string;
      icon: string;
    };
  };
  timestamp: string;
}

export interface WeatherForecast {
  location: {
    name: string;
    lat: number;
    lon: number;
  };
  forecast: {
    date: string;
    datetime: string;
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    precipitation: number;
    weather: {
      main: string;
      description: string;
      icon: string;
    };
  }[];
  timestamp: string;
}

export interface DailyForecast {
  location: {
    name: string;
    lat: number;
    lon: number;
  };
  forecast: {
    date: string;
    temperature: {
      min: number;
      max: number;
      average: number;
    };
    humidity: number;
    pressure: number;
    windSpeed: number;
    precipitation: number;
    weather: {
      main: string;
      description: string;
      icon: string;
    };
  }[];
  timestamp: string;
}

export interface HistoricalWeather {
  location: {
    name: string;
    lat: number;
    lon: number;
  };
  data: {
    datetime: string;
    date: string;
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    precipitation: number;
    weather: {
      main: string;
      description: string;
      icon: string;
    };
  }[];
  period: {
    start: string;
    end: string;
  };
  timestamp: string;
}

export interface HistoricalDailyWeather {
  location: {
    name: string;
    lat: number;
    lon: number;
  };
  data: {
    date: string;
    temperature: {
      min: number;
      max: number;
      average: number;
    };
    humidity: number;
    pressure: number;
    windSpeed: number;
    precipitation: number;
    weather: {
      main: string;
      description: string;
    };
  }[];
  period: {
    start: string;
    end: string;
  };
  timestamp: string;
}

export interface WeatherResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface AgriculturalInsights {
  growingDegreeDays: number;
  evapotranspiration: number;
  soilTemperature: number;
  frostRisk: boolean;
  irrigationRecommendation: string;
  sprayingWindow: boolean;
  heatStress: boolean;
}

export interface AgriculturalWeatherResponse {
  success: boolean;
  data?: {
    current: CurrentWeather;
    forecast: WeatherForecast;
    dailyForecast: DailyForecast;
    insights: AgriculturalInsights;
  };
  error?: string;
  timestamp: string;
}

class WeatherService {
  private readonly BASE_URL = "https://api.openweathermap.org/data/2.5";
  private readonly HISTORY_URL = "https://history.openweathermap.org/data/2.5/history/city";
  private readonly API_KEY = process.env.OPEN_WEATHER_KEY;

  constructor() {
    if (!this.API_KEY) {
      throw new Error("OpenWeatherMap API key not found in environment variables");
    }
  }

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherResponse<CurrentWeather>> {
    try {
      const response = await axios.get(`${this.BASE_URL}/weather`, {
        params: {
          lat,
          lon,
          appid: this.API_KEY,
          units: "metric"
        }
      });

      const data = response.data;
      
      const currentWeather: CurrentWeather = {
        location: {
          name: data.name,
          lat: data.coord.lat,
          lon: data.coord.lon,
          country: data.sys.country
        },
        current: {
          temperature: data.main.temp,
          feelsLike: data.main.feels_like,
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind.speed,
          windDirection: data.wind.deg || 0,
          visibility: data.visibility / 1000, 
          uvIndex: 0, 
          weather: {
            main: data.weather[0].main,
            description: data.weather[0].description,
            icon: data.weather[0].icon
          }
        },
        timestamp: new Date().toISOString()
      };

      return {
        success: true,
        data: currentWeather,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("❌ Failed to fetch current weather:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Weather API error",
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get 5-day weather forecast (3-hour intervals)
   */
  async getHourlyForecast(lat: number, lon: number): Promise<WeatherResponse<WeatherForecast>> {
    try {
      const response = await axios.get(`${this.BASE_URL}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.API_KEY,
          units: "metric"
        }
      });

      const data = response.data;
      
      const forecast: WeatherForecast = {
        location: {
          name: data.city.name,
          lat: data.city.coord.lat,
          lon: data.city.coord.lon
        },
        forecast: data.list.map((item: any) => ({
          date: new Date(item.dt * 1000).toISOString().split('T')[0],
          datetime: new Date(item.dt * 1000).toISOString(),
          temperature: item.main.temp,
          humidity: item.main.humidity,
          pressure: item.main.pressure,
          windSpeed: item.wind.speed,
          precipitation: item.rain ? item.rain["3h"] || 0 : 0,
          weather: {
            main: item.weather[0].main,
            description: item.weather[0].description,
            icon: item.weather[0].icon
          }
        })),
        timestamp: new Date().toISOString()
      };

      return {
        success: true,
        data: forecast,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("❌ Failed to fetch hourly forecast:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Weather API error",
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get daily forecast by aggregating hourly data
   */
  async getDailyForecast(lat: number, lon: number): Promise<WeatherResponse<DailyForecast>> {
    try {
      const hourlyResponse = await this.getHourlyForecast(lat, lon);
      
      if (!hourlyResponse.success || !hourlyResponse.data) {
        throw new Error("Failed to fetch hourly forecast for daily aggregation");
      }

      const hourlyData = hourlyResponse.data;
      const dailyMap = new Map<string, any[]>();

      
      hourlyData.forecast.forEach(item => {
        const date = item.date;
        if (!dailyMap.has(date)) {
          dailyMap.set(date, []);
        }
        dailyMap.get(date)!.push(item);
      });

      
      const dailyForecast: DailyForecast = {
        location: hourlyData.location,
        forecast: Array.from(dailyMap.entries()).map(([date, items]) => {
          const temperatures = items.map(item => item.temperature);
          const precipitationSum = items.reduce((sum, item) => sum + item.precipitation, 0);
          const avgHumidity = items.reduce((sum, item) => sum + item.humidity, 0) / items.length;
          const avgPressure = items.reduce((sum, item) => sum + item.pressure, 0) / items.length;
          const avgWindSpeed = items.reduce((sum, item) => sum + item.windSpeed, 0) / items.length;
          
          return {
            date,
            temperature: {
              min: Math.min(...temperatures),
              max: Math.max(...temperatures),
              average: temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length
            },
            humidity: Math.round(avgHumidity),
            pressure: Math.round(avgPressure),
            windSpeed: Math.round(avgWindSpeed * 100) / 100,
            precipitation: Math.round(precipitationSum * 100) / 100,
            weather: {
              main: items[Math.floor(items.length / 2)].weather.main,
              description: items[Math.floor(items.length / 2)].weather.description,
              icon: items[Math.floor(items.length / 2)].weather.icon
            }
          };
        }),
        timestamp: new Date().toISOString()
      };

      return {
        success: true,
        data: dailyForecast,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("❌ Failed to create daily forecast:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Weather API error",
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get historical weather data using History API
   */
  async getHistoricalWeather(lat: number, lon: number, startDate: string, endDate: string): Promise<WeatherResponse<HistoricalWeather>> {
    try {
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
      
      const response = await axios.get(`${this.HISTORY_URL}`, {
        params: {
          lat,
          lon,
          type: "hour",
          start: startTimestamp,
          end: endTimestamp,
          appid: this.API_KEY,
          units: "metric"
        }
      });

      const data = response.data;
      
      const historical: HistoricalWeather = {
        location: {
          name: data.city_name || `${lat}, ${lon}`,
          lat,
          lon
        },
        data: data.list.map((item: any) => ({
          datetime: new Date(item.dt * 1000).toISOString(),
          date: new Date(item.dt * 1000).toISOString().split('T')[0],
          temperature: item.main.temp,
          humidity: item.main.humidity,
          pressure: item.main.pressure,
          windSpeed: item.wind.speed,
          precipitation: item.rain ? item.rain["1h"] || 0 : 0,
          weather: {
            main: item.weather[0].main,
            description: item.weather[0].description,
            icon: item.weather[0].icon
          }
        })),
        period: {
          start: startDate,
          end: endDate
        },
        timestamp: new Date().toISOString()
      };

      return {
        success: true,
        data: historical,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("❌ Failed to fetch historical weather:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Weather API error",
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get historical weather data for a specific number of days
   */
  async getHistoricalWeatherByDays(lat: number, lon: number, days: number): Promise<WeatherResponse<HistoricalWeather>> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
      
      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      const cnt = days * 24; 
      
      const response = await axios.get(`${this.HISTORY_URL}`, {
        params: {
          lat,
          lon,
          type: "hour",
          start: startTimestamp,
          cnt: cnt,
          appid: this.API_KEY,
          units: "metric"
        }
      });

      const data = response.data;
      
      const historical: HistoricalWeather = {
        location: {
          name: data.city_name || `${lat}, ${lon}`,
          lat,
          lon
        },
        data: data.list.map((item: any) => ({
          datetime: new Date(item.dt * 1000).toISOString(),
          date: new Date(item.dt * 1000).toISOString().split('T')[0],
          temperature: item.main.temp,
          humidity: item.main.humidity,
          pressure: item.main.pressure,
          windSpeed: item.wind.speed,
          precipitation: item.rain ? item.rain["1h"] || 0 : 0,
          weather: {
            main: item.weather[0].main,
            description: item.weather[0].description,
            icon: item.weather[0].icon
          }
        })),
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        timestamp: new Date().toISOString()
      };

      return {
        success: true,
        data: historical,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("❌ Failed to fetch historical weather by days:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Weather API error",
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get historical daily weather by aggregating hourly historical data
   */
  async getHistoricalDailyWeather(lat: number, lon: number, startDate: string, endDate: string): Promise<WeatherResponse<HistoricalDailyWeather>> {
    try {
      const historicalResponse = await this.getHistoricalWeather(lat, lon, startDate, endDate);
      
      if (!historicalResponse.success || !historicalResponse.data) {
        throw new Error("Failed to fetch historical weather for daily aggregation");
      }

      const historicalData = historicalResponse.data;
      const dailyMap = new Map<string, any[]>();

      
      historicalData.data.forEach(item => {
        const date = item.date;
        if (!dailyMap.has(date)) {
          dailyMap.set(date, []);
        }
        dailyMap.get(date)!.push(item);
      });

      
      const dailyData: HistoricalDailyWeather = {
        location: historicalData.location,
        data: Array.from(dailyMap.entries()).map(([date, items]) => {
          const temperatures = items.map(item => item.temperature);
          const precipitationSum = items.reduce((sum, item) => sum + item.precipitation, 0);
          const avgHumidity = items.reduce((sum, item) => sum + item.humidity, 0) / items.length;
          const avgPressure = items.reduce((sum, item) => sum + item.pressure, 0) / items.length;
          const avgWindSpeed = items.reduce((sum, item) => sum + item.windSpeed, 0) / items.length;
          
          return {
            date,
            temperature: {
              min: Math.min(...temperatures),
              max: Math.max(...temperatures),
              average: temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length
            },
            humidity: Math.round(avgHumidity),
            pressure: Math.round(avgPressure),
            windSpeed: Math.round(avgWindSpeed * 100) / 100,
            precipitation: Math.round(precipitationSum * 100) / 100,
            weather: {
              main: items[Math.floor(items.length / 2)].weather.main,
              description: items[Math.floor(items.length / 2)].weather.description
            }
          };
        }).sort((a, b) => a.date.localeCompare(b.date)),
        period: historicalData.period,
        timestamp: new Date().toISOString()
      };

      return {
        success: true,
        data: dailyData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("❌ Failed to create historical daily weather:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Weather API error",
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate Growing Degree Days from historical data
   */
  calculateGrowingDegreeDays(historicalData: HistoricalDailyWeather, baseTemp: number = 10): number {
    return historicalData.data.reduce((total, day) => {
      const avgTemp = day.temperature.average;
      const gdd = Math.max(0, avgTemp - baseTemp);
      return total + gdd;
    }, 0);
  }

  /**
   * Calculate agricultural insights from weather data
   */
  calculateAgriculturalInsights(current: CurrentWeather, forecast: DailyForecast): AgriculturalInsights {
    const temp = current.current.temperature;
    const humidity = current.current.humidity;
    const windSpeed = current.current.windSpeed;
    
    
    const baseTemp = 10;
    const growingDegreeDays = Math.max(0, temp - baseTemp);
    
    
    const evapotranspiration = Math.max(0, 
      (0.0023 * (temp + 17.8) * Math.sqrt(Math.abs(forecast.forecast[0]?.temperature.max - forecast.forecast[0]?.temperature.min || 10)) * 
      (temp + 273.16) / 273.16) * 2.45
    );
    
    
    const soilTemperature = temp * 0.85; 
    
    
    const frostRisk = forecast.forecast.slice(0, 3).some(day => day.temperature.min < 2);
    
    
    let irrigationRecommendation = "Monitor";
    if (humidity < 40 && temp > 25) {
      irrigationRecommendation = "High need";
    } else if (humidity < 60 && temp > 20) {
      irrigationRecommendation = "Moderate need";
    } else if (humidity > 80) {
      irrigationRecommendation = "Low need";
    }
    
    
    const sprayingWindow = windSpeed < 15 && 
      !forecast.forecast.slice(0, 1).some(day => day.precipitation > 0);
    
    
    const heatStress = temp > 35 || (temp > 30 && humidity > 70);
    
    return {
      growingDegreeDays,
      evapotranspiration,
      soilTemperature,
      frostRisk,
      irrigationRecommendation,
      sprayingWindow,
      heatStress
    };
  }

  /**
   * Get comprehensive weather data for agricultural planning
   */
  async getAgriculturalWeather(lat: number, lon: number): Promise<AgriculturalWeatherResponse> {
    try {
      const [current, forecast, dailyForecast] = await Promise.all([
        this.getCurrentWeather(lat, lon),
        this.getHourlyForecast(lat, lon),
        this.getDailyForecast(lat, lon)
      ]);

      if (!current.success || !forecast.success || !dailyForecast.success) {
        throw new Error("Failed to fetch complete weather data");
      }

      const insights = this.calculateAgriculturalInsights(current.data!, dailyForecast.data!);

      return {
        success: true,
        data: {
          current: current.data!,
          forecast: forecast.data!,
          dailyForecast: dailyForecast.data!,
          insights
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("❌ Failed to fetch agricultural weather:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Weather service error",
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const weatherService = new WeatherService();
export default weatherService; 