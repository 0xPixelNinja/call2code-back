import axios from "axios";
import * as cheerio from "cheerio";
import { prisma } from "../lib/database";

export interface MarketPrice {
  commodity: string;
  variety: string;
  maxPrice: number;
  minPrice: number;
  date: string;
}

export interface MarketPricesResponse {
  success: boolean;
  data?: MarketPrice[];
  error?: string;
  lastUpdated: string;
  totalItems: number;
  source: "database" | "api";
}

class MarketService {
  private readonly AGMARKNET_URL =
    "https://agmarknet.gov.in/agnew/namticker.aspx";

  /**
   * Fetch market prices from AGMARKNET and save to database
   */
  async fetchAndSaveMarketPrices(): Promise<MarketPricesResponse> {
    try {
      const response = await axios.get(this.AGMARKNET_URL, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        timeout: 10000,
      });

      const marketPrices = this.parseMarketPricesHTML(response.data);

      if (marketPrices.length > 0) {
        await this.saveMarketPricesToDatabase(marketPrices);
        console.log(`📈 Saved ${marketPrices.length} market prices to database`);
      }

      return {
        success: true,
        data: marketPrices,
        lastUpdated: new Date().toISOString(),
        totalItems: marketPrices.length,
        source: "api",
      };
    } catch (error) {
      console.error("❌ Failed to fetch market prices:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        lastUpdated: new Date().toISOString(),
        totalItems: 0,
        source: "api",
      };
    }
  }

  /**
   * Save market prices to database
   */
  private async saveMarketPricesToDatabase(marketPrices: MarketPrice[]) {
    try {
      for (const price of marketPrices) {
        await prisma.marketPrice.upsert({
          where: {
            commodity_variety_date: {
              commodity: price.commodity,
              variety: price.variety,
              date: price.date,
            },
          },
          update: {
            maxPrice: price.maxPrice,
            minPrice: price.minPrice,
            updatedAt: new Date(),
          },
          create: {
            commodity: price.commodity,
            variety: price.variety,
            maxPrice: price.maxPrice,
            minPrice: price.minPrice,
            date: price.date,
          },
        });
      }
    } catch (error) {
      console.error("❌ Failed to save market prices to database:", error);
      throw error;
    }
  }

  /**
   * Get market prices from database
   */
  async getMarketPricesFromDatabase(): Promise<MarketPricesResponse> {
    try {
      const marketPrices = await prisma.marketPrice.findMany({
        orderBy: [{ date: "desc" }, { commodity: "asc" }],
        take: 100,
      });

      const formattedPrices: MarketPrice[] = marketPrices.map((price: any) => ({
        commodity: price.commodity,
        variety: price.variety,
        maxPrice: price.maxPrice,
        minPrice: price.minPrice,
        date: price.date,
      }));

      const latestRecord = await prisma.marketPrice.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      });

      return {
        success: true,
        data: formattedPrices,
        lastUpdated:
          latestRecord?.updatedAt.toISOString() || new Date().toISOString(),
        totalItems: formattedPrices.length,
        source: "database",
      };
    } catch (error) {
      console.error("❌ Failed to fetch market prices from database:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Database error occurred",
        lastUpdated: new Date().toISOString(),
        totalItems: 0,
        source: "database",
      };
    }
  }

  /**
   * Get latest market prices for today
   */
  async getLatestMarketPrices(): Promise<MarketPricesResponse> {
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const marketPrices = await prisma.marketPrice.findMany({
        where: { date: today },
        orderBy: { commodity: "asc" },
      });

      if (marketPrices.length === 0) {
        const latestDate = await prisma.marketPrice.findFirst({
          orderBy: { date: "desc" },
          select: { date: true },
        });

        if (latestDate) {
          const latestPrices = await prisma.marketPrice.findMany({
            where: { date: latestDate.date },
            orderBy: { commodity: "asc" },
          });

          const formattedPrices: MarketPrice[] = latestPrices.map(
            (price: any) => ({
              commodity: price.commodity,
              variety: price.variety,
              maxPrice: price.maxPrice,
              minPrice: price.minPrice,
              date: price.date,
            })
          );

          return {
            success: true,
            data: formattedPrices,
            lastUpdated:
              latestPrices[0]?.updatedAt.toISOString() ||
              new Date().toISOString(),
            totalItems: formattedPrices.length,
            source: "database",
          };
        }
      }

      const formattedPrices: MarketPrice[] = marketPrices.map((price: any) => ({
        commodity: price.commodity,
        variety: price.variety,
        maxPrice: price.maxPrice,
        minPrice: price.minPrice,
        date: price.date,
      }));

      return {
        success: true,
        data: formattedPrices,
        lastUpdated:
          marketPrices[0]?.updatedAt.toISOString() || new Date().toISOString(),
        totalItems: formattedPrices.length,
        source: "database",
      };
    } catch (error) {
      console.error("❌ Failed to fetch latest market prices:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Database error occurred",
        lastUpdated: new Date().toISOString(),
        totalItems: 0,
        source: "database",
      };
    }
  }

  /**
   * Parse HTML response to extract market price data
   */
  private parseMarketPricesHTML(html: string): MarketPrice[] {
    const $ = cheerio.load(html);
    const marketPrices: MarketPrice[] = [];

    const dateText = $("#rptrArrdate_lblDate_0").text().trim();
    const date = this.parseDate(dateText);

    $("#DataListTicker td").each((index, element) => {
      try {
        const $element = $(element);

        const commodityElement = $element.find('span[id*="lblTicker_"]');
        const commodity = commodityElement.text().trim();

        const varietyElement = $element.find('span[id*="lblTitle_"]');
        const variety = varietyElement.text().trim();

        const maxPriceElement = $element.find('span[id*="lblMaxprice_"]');
        const maxPriceText = maxPriceElement.text().trim();
        const maxPrice = this.parsePrice(maxPriceText);

        const minPriceElement = $element.find('span[id*="lblminprice_"]');
        const minPriceText = minPriceElement.text().trim();
        const minPrice = this.parsePrice(minPriceText);

        if (commodity && variety && maxPrice > 0 && minPrice > 0) {
          marketPrices.push({
            commodity: commodity,
            variety: variety,
            maxPrice: maxPrice,
            minPrice: minPrice,
            date: date,
          });
        }
      } catch (error) {
        // Silent skip for parsing errors
      }
    });

    return marketPrices;
  }

  /**
   * Parse date string to ISO format
   */
  private parseDate(dateText: string): string {
    try {
      const cleanDate = dateText.replace(/\s+/g, " ").trim();
      const date = new Date(cleanDate);

      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
      }

      return date.toISOString().split("T")[0];
    } catch (error) {
      return new Date().toISOString().split("T")[0];
    }
  }

  /**
   * Parse price string to number
   */
  private parsePrice(priceText: string): number {
    try {
      const cleanPrice = priceText.replace(/[^\d.]/g, "");
      const price = parseFloat(cleanPrice);

      return isNaN(price) ? 0 : price;
    } catch (error) {
      return 0;
    }
  }
}

export const marketService = new MarketService();
export default marketService;
