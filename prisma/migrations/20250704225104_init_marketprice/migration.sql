-- CreateTable
CREATE TABLE "market_prices" (
    "id" TEXT NOT NULL,
    "commodity" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "maxPrice" DOUBLE PRECISION NOT NULL,
    "minPrice" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "market_prices_commodity_variety_date_key" ON "market_prices"("commodity", "variety", "date");
