import { Router } from "express";
import { weatherService } from "../services/weather";

const router = Router();


router.get("/current", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: "Missing coordinates",
        message: "Please provide lat and lon parameters"
      });
    }

    const weather = await weatherService.getCurrentWeather(
      parseFloat(lat as string), 
      parseFloat(lon as string)
    );
    
    res.json(weather);
  } catch (error) {
    console.error("Error in current weather endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to fetch current weather"
    });
  }
});


router.get("/forecast", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: "Missing coordinates",
        message: "Please provide lat and lon parameters"
      });
    }

    const forecast = await weatherService.getDailyForecast(
      parseFloat(lat as string), 
      parseFloat(lon as string)
    );
    
    res.json(forecast);
  } catch (error) {
    console.error("Error in forecast endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to fetch weather forecast"
    });
  }
});


router.get("/hourly", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: "Missing coordinates",
        message: "Please provide lat and lon parameters"
      });
    }

    const hourly = await weatherService.getHourlyForecast(
      parseFloat(lat as string), 
      parseFloat(lon as string)
    );
    
    res.json(hourly);
  } catch (error) {
    console.error("Error in hourly forecast endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to fetch hourly forecast"
    });
  }
});


router.get("/agricultural", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: "Missing coordinates",
        message: "Please provide lat and lon parameters"
      });
    }

    const agricultural = await weatherService.getAgriculturalWeather(
      parseFloat(lat as string), 
      parseFloat(lon as string)
    );
    
    res.json(agricultural);
  } catch (error) {
    console.error("Error in agricultural weather endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to fetch agricultural weather data"
    });
  }
});


router.get("/historical", async (req, res) => {
  try {
    const { lat, lon, start, end } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: "Missing coordinates",
        message: "Please provide lat and lon parameters"
      });
    }

    
    let startDate = start as string;
    let endDate = end as string;
    
    if (!startDate && !endDate) {
      const now = new Date();
      endDate = now.toISOString().split('T')[0];
      const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      startDate = sevenDaysAgo.toISOString().split('T')[0];
    } else if (!startDate && endDate) {
      const endDateObj = new Date(endDate);
      const sevenDaysAgo = new Date(endDateObj.getTime() - (7 * 24 * 60 * 60 * 1000));
      startDate = sevenDaysAgo.toISOString().split('T')[0];
    } else if (startDate && !endDate) {
      endDate = new Date().toISOString().split('T')[0];
    }

    const historical = await weatherService.getHistoricalWeather(
      parseFloat(lat as string), 
      parseFloat(lon as string),
      startDate,
      endDate
    );
    
    res.json(historical);
  } catch (error) {
    console.error("Error in historical weather endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to fetch historical weather data"
    });
  }
});


router.get("/historical-days", async (req, res) => {
  try {
    const { lat, lon, days } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: "Missing coordinates",
        message: "Please provide lat and lon parameters"
      });
    }

    const numDays = days ? parseInt(days as string) : 7;

    const historical = await weatherService.getHistoricalWeatherByDays(
      parseFloat(lat as string), 
      parseFloat(lon as string),
      numDays
    );
    
    res.json(historical);
  } catch (error) {
    console.error("Error in historical weather by days endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to fetch historical weather data"
    });
  }
});


router.get("/historical-daily", async (req, res) => {
  try {
    const { lat, lon, start, end } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: "Missing coordinates",
        message: "Please provide lat and lon parameters"
      });
    }

    
    let startDate = start as string;
    let endDate = end as string;
    
    if (!startDate && !endDate) {
      const now = new Date();
      endDate = now.toISOString().split('T')[0];
      const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      startDate = sevenDaysAgo.toISOString().split('T')[0];
    } else if (!startDate && endDate) {
      const endDateObj = new Date(endDate);
      const sevenDaysAgo = new Date(endDateObj.getTime() - (7 * 24 * 60 * 60 * 1000));
      startDate = sevenDaysAgo.toISOString().split('T')[0];
    } else if (startDate && !endDate) {
      endDate = new Date().toISOString().split('T')[0];
    }

    const historical = await weatherService.getHistoricalDailyWeather(
      parseFloat(lat as string), 
      parseFloat(lon as string),
      startDate,
      endDate
    );
    
    res.json(historical);
  } catch (error) {
    console.error("Error in historical daily weather endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to fetch historical daily weather data"
    });
  }
});

export default router; 