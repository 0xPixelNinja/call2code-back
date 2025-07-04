import axios from "axios";
import * as cheerio from "cheerio";

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
}

class MarketService {
  private readonly AGMARKNET_URL =
    "https://agmarknet.gov.in/agnew/namticker.aspx";

  /**
   * Fetch market prices from AGMARKNET
   */
  async getMarketPrices(): Promise<MarketPricesResponse> {
    try {
      console.log("Fetching market prices from AGMARKNET...");

      const response = await axios.get(this.AGMARKNET_URL, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        timeout: 10000,
      });

      const marketPrices = this.parseMarketPricesHTML(response.data);

      return {
        success: true,
        data: marketPrices,
        lastUpdated: new Date().toISOString(),
        totalItems: marketPrices.length,
      };
    } catch (error) {
      console.error("Error fetching market prices:", error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        lastUpdated: new Date().toISOString(),
        totalItems: 0,
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
        console.warn(`Error parsing ticker item at index ${index}:`, error);
      }
    });

    console.log(`Successfully parsed ${marketPrices.length} market prices`);
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
      console.warn("Error parsing date:", dateText, error);
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
      console.warn("Error parsing price:", priceText, error);
      return 0;
    }
  }

  /**
   * Get formatted market prices for API response
   */
  async getFormattedMarketPrices(): Promise<MarketPricesResponse> {
    const result = await this.getMarketPrices();

    if (result.success && result.data) {
      result.data.sort((a, b) => a.commodity.localeCompare(b.commodity));

      console.log(
        `Market prices retrieved successfully: ${result.data.length} items`
      );
    }

    return result;
  }
}

export const marketService = new MarketService();
export default marketService;
