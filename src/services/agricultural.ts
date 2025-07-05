import { weatherService } from "./weather";


export interface FrostAlert {
  risk: "none" | "low" | "moderate" | "high" | "critical";
  message: string;
  action: string;
  timeframe: string;
  temperature: number;
}

export interface IrrigationAdvice {
  recommendation: "immediate" | "within_24h" | "within_48h" | "skip" | "monitor";
  message: string;
  reason: string;
  nextCheck: string;
  waterAmount?: string;
}

export interface SprayingWindow {
  suitable: boolean;
  message: string;
  bestTime?: string;
  nextOpportunity?: string;
  reason: string;
}

export interface HeatStressAlert {
  risk: "none" | "low" | "moderate" | "high" | "extreme";
  message: string;
  action: string;
  duration: string;
  temperature: number;
}

export interface CropAdvisory {
  location: {
    name: string;
    lat: number;
    lon: number;
  };
  frost: FrostAlert;
  irrigation: IrrigationAdvice;
  spraying: SprayingWindow;
  heatStress: HeatStressAlert;
  generalAdvice: string[];
  priority: "low" | "medium" | "high" | "urgent";
  lastUpdated: string;
}

export interface AdvisoryResponse {
  success: boolean;
  data?: CropAdvisory;
  error?: string;
  timestamp: string;
}

class AgriculturalService {

  /**
   * Analyze frost risk from weather data
   */
  private analyzeFrostRisk(currentTemp: number, forecastData: any[]): FrostAlert {
    const minTemps = forecastData.slice(0, 8).map(item => item.temperature); 
    const lowestTemp = Math.min(...minTemps);
    
    let risk: FrostAlert["risk"] = "none";
    let message = "";
    let action = "";
    let timeframe = "";

    if (lowestTemp <= -2) {
      risk = "critical";
      message = "Severe frost expected - immediate action required";
      action = "Cover all sensitive crops, use frost protection methods, move potted plants indoors";
      timeframe = "Within next 6-12 hours";
    } else if (lowestTemp <= 0) {
      risk = "high";
      message = "Hard frost likely - protect vulnerable crops";
      action = "Cover young plants, drain irrigation lines, harvest sensitive crops";
      timeframe = "Within next 12-24 hours";
    } else if (lowestTemp <= 2) {
      risk = "moderate";
      message = "Light frost possible - monitor closely";
      action = "Prepare frost protection materials, monitor weather updates";
      timeframe = "Within next 24-48 hours";
    } else if (lowestTemp <= 5) {
      risk = "low";
      message = "Cool temperatures ahead - minimal frost risk";
      action = "Normal operations, keep frost protection ready";
      timeframe = "Next 2-3 days";
    } else {
      risk = "none";
      message = "No frost risk detected";
      action = "Continue normal farming activities";
      timeframe = "Next 5 days";
    }

    return {
      risk,
      message,
      action,
      timeframe,
      temperature: lowestTemp
    };
  }

  /**
   * Generate irrigation advice based on weather conditions
   */
  private generateIrrigationAdvice(currentWeather: any, forecastData: any[]): IrrigationAdvice {
    const currentTemp = currentWeather.temperature;
    const currentHumidity = currentWeather.humidity;
    
    
    const rainForecast = forecastData.slice(0, 16); 
    const totalRain = rainForecast.reduce((sum, item) => sum + (item.precipitation || 0), 0);
    const significantRain = totalRain > 5; 
    
    
    const waterStress = currentTemp > 25 && currentHumidity < 50;
    const highWaterStress = currentTemp > 30 && currentHumidity < 40;
    const extremeWaterStress = currentTemp > 35 && currentHumidity < 35;

    let recommendation: IrrigationAdvice["recommendation"];
    let message = "";
    let reason = "";
    let nextCheck = "";
    let waterAmount = "";

    if (significantRain) {
      recommendation = "skip";
      message = "Skip irrigation - adequate rainfall expected";
      reason = `${totalRain.toFixed(1)}mm rain forecast in next 48 hours`;
      nextCheck = "Check again after rainfall";
    } else if (extremeWaterStress) {
      recommendation = "immediate";
      message = "Immediate irrigation required - extreme heat stress conditions";
      reason = `Very high temperature (${currentTemp}°C) with low humidity (${currentHumidity}%)`;
      nextCheck = "Monitor every 6 hours";
      waterAmount = "Deep watering recommended - 25-30mm equivalent";
    } else if (highWaterStress) {
      recommendation = "within_24h";
      message = "Irrigation needed within 24 hours - high stress conditions";
      reason = `High temperature (${currentTemp}°C) with low humidity (${currentHumidity}%)`;
      nextCheck = "Check again in 12 hours";
      waterAmount = "Regular watering - 15-20mm equivalent";
    } else if (waterStress) {
      recommendation = "within_48h";
      message = "Plan irrigation within 48 hours - moderate stress detected";
      reason = `Moderate temperature (${currentTemp}°C) with moderate humidity (${currentHumidity}%)`;
      nextCheck = "Check again in 24 hours";
      waterAmount = "Light watering - 10-15mm equivalent";
    } else {
      recommendation = "monitor";
      message = "Continue monitoring - current conditions adequate";
      reason = `Acceptable temperature (${currentTemp}°C) and humidity (${currentHumidity}%)`;
      nextCheck = "Check again in 24 hours";
    }

    return {
      recommendation,
      message,
      reason,
      nextCheck,
      waterAmount
    };
  }

  /**
   * Determine optimal spraying conditions
   */
  private analyzeSprayingConditions(currentWeather: any, forecastData: any[]): SprayingWindow {
    const currentWind = currentWeather.windSpeed;
    const currentTemp = currentWeather.temperature;
    
    
    const next24h = forecastData.slice(0, 8);
    
    
    const goodWindows = next24h.filter(item => 
      item.windSpeed < 15 && 
      (item.precipitation || 0) === 0 && 
      item.temperature > 10 && item.temperature < 30 
    );

    let suitable = false;
    let message = "";
    let bestTime = "";
    let nextOpportunity = "";
    let reason = "";

    if (currentWind > 20) {
      suitable = false;
      message = "Spraying not recommended - wind too strong";
      reason = `Current wind speed: ${currentWind} km/h (safe limit: <15 km/h)`;
      const nextGoodWindow = goodWindows[0];
      if (nextGoodWindow) {
        const hours = next24h.indexOf(nextGoodWindow) * 3;
        nextOpportunity = `Next opportunity in ${hours} hours`;
      } else {
        nextOpportunity = "Check forecast tomorrow";
      }
    } else if (currentTemp > 30) {
      suitable = false;
      message = "Spraying not recommended - temperature too high";
      reason = `Current temperature: ${currentTemp}°C (avoid spraying above 30°C)`;
      nextOpportunity = "Wait for cooler conditions (early morning/evening)";
    } else if (goodWindows.length > 0) {
      suitable = true;
      message = "Good spraying conditions available";
      reason = `Low wind (${currentWind} km/h), suitable temperature (${currentTemp}°C)`;
      
      
      const morningWindows = goodWindows.filter((_, index) => {
        const hour = (new Date().getHours() + (index * 3)) % 24;
        return hour >= 6 && hour <= 10; 
      });
      
      if (morningWindows.length > 0) {
        bestTime = "Early morning (6-10 AM) recommended for optimal results";
      } else {
        bestTime = "Current conditions suitable - spray when convenient";
      }
    } else {
      suitable = false;
      message = "Poor spraying conditions - wait for better weather";
      reason = "High wind or rain forecast in next 24 hours";
      nextOpportunity = "Check forecast again in 12 hours";
    }

    return {
      suitable,
      message,
      bestTime,
      nextOpportunity,
      reason
    };
  }

  /**
   * Assess heat stress risk
   */
  private assessHeatStress(currentWeather: any, forecastData: any[]): HeatStressAlert {
    const currentTemp = currentWeather.temperature;
    const currentHumidity = currentWeather.humidity;
    
    
    const heatIndex = currentTemp + (currentHumidity > 40 ? (currentHumidity - 40) * 0.2 : 0);
    
    
    const highTempPeriods = forecastData.filter(item => item.temperature > 30).length;
    const duration = `${highTempPeriods * 3} hours of elevated temperatures expected`;

    let risk: HeatStressAlert["risk"] = "none";
    let message = "";
    let action = "";

    if (currentTemp > 40 || (currentTemp > 35 && currentHumidity > 70)) {
      risk = "extreme";
      message = "Extreme heat stress - immediate action required";
      action = "Increase irrigation frequency, provide shade, harvest heat-sensitive crops immediately";
    } else if (currentTemp > 35 || (currentTemp > 30 && currentHumidity > 80)) {
      risk = "high";
      message = "High heat stress - crops need protection";
      action = "Increase irrigation, apply mulch, avoid field work during peak heat";
    } else if (currentTemp > 30 || (currentTemp > 25 && currentHumidity > 85)) {
      risk = "moderate";
      message = "Moderate heat stress - monitor crops closely";
      action = "Ensure adequate water supply, consider morning/evening irrigation";
    } else if (currentTemp > 25) {
      risk = "low";
      message = "Mild heat stress possible - maintain normal care";
      action = "Continue regular irrigation schedule, monitor plant health";
    } else {
      risk = "none";
      message = "No heat stress detected";
      action = "Normal growing conditions - continue standard practices";
    }

    return {
      risk,
      message,
      action,
      duration,
      temperature: currentTemp
    };
  }

  /**
   * Generate priority level and general advice
   */
  private generateOverallAdvice(frost: FrostAlert, irrigation: IrrigationAdvice, spraying: SprayingWindow, heatStress: HeatStressAlert): { priority: CropAdvisory["priority"], generalAdvice: string[] } {
    const advice: string[] = [];
    let priority: CropAdvisory["priority"] = "low";

    
    if (frost.risk === "critical" || heatStress.risk === "extreme" || irrigation.recommendation === "immediate") {
      priority = "urgent";
      advice.push("⚠️ Urgent action required - check all alerts immediately");
    } else if (frost.risk === "high" || heatStress.risk === "high" || irrigation.recommendation === "within_24h") {
      priority = "high";
      advice.push("⚡ High priority - address within 24 hours");
    } else if (frost.risk === "moderate" || heatStress.risk === "moderate" || irrigation.recommendation === "within_48h") {
      priority = "medium";
      advice.push("📋 Medium priority - plan accordingly");
    }

    
    if (spraying.suitable) {
      advice.push("✅ Good conditions for pesticide/herbicide application");
    }

    if (irrigation.recommendation === "skip") {
      advice.push("💧 Rain expected - save on irrigation costs");
    }

    if (frost.risk === "none" && heatStress.risk === "none") {
      advice.push("🌿 Optimal growing conditions - ideal for field work");
    }

    
    advice.push("📱 Check updates every 12-24 hours for changing conditions");

    return { priority, generalAdvice: advice };
  }

  /**
   * Get comprehensive crop advisory
   */
  async getCropAdvisory(lat: number, lon: number): Promise<AdvisoryResponse> {
    try {
      
      const [currentWeather, hourlyForecast] = await Promise.all([
        weatherService.getCurrentWeather(lat, lon),
        weatherService.getHourlyForecast(lat, lon)
      ]);

      if (!currentWeather.success || !hourlyForecast.success) {
        throw new Error("Failed to fetch weather data for analysis");
      }

      const current = currentWeather.data!.current;
      const forecast = hourlyForecast.data!.forecast;
      const location = currentWeather.data!.location;

      
      const frost = this.analyzeFrostRisk(current.temperature, forecast);
      const irrigation = this.generateIrrigationAdvice(current, forecast);
      const spraying = this.analyzeSprayingConditions(current, forecast);
      const heatStress = this.assessHeatStress(current, forecast);
      
      const { priority, generalAdvice } = this.generateOverallAdvice(frost, irrigation, spraying, heatStress);

      const advisory: CropAdvisory = {
        location: {
          name: location.name,
          lat: location.lat,
          lon: location.lon
        },
        frost,
        irrigation,
        spraying,
        heatStress,
        generalAdvice,
        priority,
        lastUpdated: new Date().toISOString()
      };

      return {
        success: true,
        data: advisory,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("❌ Failed to generate crop advisory:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Agricultural analysis error",
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get specific frost alert
   */
  async getFrostAlert(lat: number, lon: number): Promise<{ success: boolean; data?: FrostAlert; error?: string }> {
    try {
      const forecast = await weatherService.getHourlyForecast(lat, lon);
      if (!forecast.success) throw new Error("Weather data unavailable");
      
      const current = await weatherService.getCurrentWeather(lat, lon);
      const currentTemp = current.data?.current.temperature || 20;
      
      const frostAlert = this.analyzeFrostRisk(currentTemp, forecast.data!.forecast);
      
      return { success: true, data: frostAlert };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Analysis failed" };
    }
  }

  /**
   * Get irrigation recommendations
   */
  async getIrrigationAdvice(lat: number, lon: number): Promise<{ success: boolean; data?: IrrigationAdvice; error?: string }> {
    try {
      const [current, forecast] = await Promise.all([
        weatherService.getCurrentWeather(lat, lon),
        weatherService.getHourlyForecast(lat, lon)
      ]);
      
      if (!current.success || !forecast.success) throw new Error("Weather data unavailable");
      
      const irrigationAdvice = this.generateIrrigationAdvice(current.data!.current, forecast.data!.forecast);
      
      return { success: true, data: irrigationAdvice };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Analysis failed" };
    }
  }
}

export const agriculturalService = new AgriculturalService();
export default agriculturalService; 