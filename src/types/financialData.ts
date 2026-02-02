export interface StockDataPoint {
  date: string;
  price: number;
  volume: number;
  change: number;
}

export interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface SectorData {
  name: string;
  value: number;
  color: string;
}

export interface CompanyData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
}