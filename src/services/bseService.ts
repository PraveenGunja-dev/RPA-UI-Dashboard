// Define interfaces directly in the service file to avoid import issues
interface StockDataPoint {
  date: string;
  price: number;
  volume: number;
  change: number;
}

interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

interface SectorData {
  name: string;
  value: number;
  color: string;
}

interface CompanyData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
}

// Mock data service for BSE India Analysis
class BSEService {
  // Fetch market indices data
  async fetchMarketIndices(): Promise<IndexData[]> {
    // In a real implementation, this would call an API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { name: 'SENSEX', value: 72500, change: 1200, changePercent: 1.68 },
          { name: 'NIFTY 50', value: 22100, change: 350, changePercent: 1.61 },
          { name: 'NIFTY BANK', value: 46200, change: 750, changePercent: 1.65 },
          { name: 'SENSEX 500', value: 18700, change: 300, changePercent: 1.63 },
          { name: 'NIFTY IT', value: 42500, change: 800, changePercent: 1.92 },
          { name: 'NIFTY PHARMA', value: 15800, change: 250, changePercent: 1.61 },
        ]);
      }, 500);
    });
  }

  // Fetch stock price data for charting
  async fetchStockData(): Promise<StockDataPoint[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { date: '2025-09-01', price: 72000, volume: 1200000, change: 0.5 },
          { date: '2025-09-02', price: 72500, volume: 1500000, change: 0.7 },
          { date: '2025-09-03', price: 73200, volume: 1800000, change: 0.9 },
          { date: '2025-09-04', price: 72800, volume: 1400000, change: -0.5 },
          { date: '2025-09-05', price: 73500, volume: 1600000, change: 0.9 },
          { date: '2025-09-06', price: 74200, volume: 1900000, change: 0.9 },
          { date: '2025-09-07', price: 73800, volume: 1700000, change: -0.5 },
          { date: '2025-09-08', price: 74500, volume: 2100000, change: 0.9 },
          { date: '2025-09-09', price: 75200, volume: 2300000, change: 0.9 },
          { date: '2025-09-10', price: 74800, volume: 1900000, change: -0.5 },
          { date: '2025-09-11', price: 75500, volume: 2200000, change: 0.9 },
          { date: '2025-09-12', price: 76200, volume: 2500000, change: 0.9 },
          { date: '2025-09-13', price: 75800, volume: 2100000, change: -0.5 },
          { date: '2025-09-14', price: 76500, volume: 2400000, change: 0.9 },
          { date: '2025-09-15', price: 77200, volume: 2700000, change: 0.9 },
          { date: '2025-09-16', price: 76800, volume: 2300000, change: -0.5 },
          { date: '2025-09-17', price: 77500, volume: 2600000, change: 0.9 },
          { date: '2025-09-18', price: 78200, volume: 2900000, change: 0.9 },
          { date: '2025-09-19', price: 77800, volume: 2500000, change: -0.5 },
          { date: '2025-09-20', price: 78500, volume: 2800000, change: 0.9 },
        ]);
      }, 500);
    });
  }

  // Fetch sector weightage data
  async fetchSectorData(): Promise<SectorData[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { name: 'Banking', value: 25, color: '#FF4500' },
          { name: 'IT', value: 20, color: '#00C9A7' },
          { name: 'Pharma', value: 15, color: '#4D90FE' },
          { name: 'Auto', value: 12, color: '#FF6B6B' },
          { name: 'FMCG', value: 10, color: '#FFD93D' },
          { name: 'Others', value: 18, color: '#9B59B6' },
        ]);
      }, 500);
    });
  }

  // Fetch top gainers
  async fetchTopGainers(): Promise<CompanyData[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { symbol: 'TCS', name: 'Tata Consultancy Services', price: 4250.50, change: 127.50, changePercent: 3.1, volume: 1250000, marketCap: '12.5L Cr' },
          { symbol: 'INFY', name: 'Infosys', price: 1520.75, change: 45.25, changePercent: 3.05, volume: 1800000, marketCap: '6.2L Cr' },
          { symbol: 'HDFC', name: 'HDFC Bank', price: 1680.25, change: 48.75, changePercent: 2.98, volume: 2500000, marketCap: '10.8L Cr' },
          { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2750.00, change: 78.50, changePercent: 2.94, volume: 3200000, marketCap: '16.2L Cr' },
          { symbol: 'ICICI', name: 'ICICI Bank', price: 1120.50, change: 31.25, changePercent: 2.87, volume: 2800000, marketCap: '7.1L Cr' },
        ]);
      }, 500);
    });
  }

  // Fetch top losers
  async fetchTopLosers(): Promise<CompanyData[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { symbol: 'ONGC', name: 'Oil and Natural Gas Corporation', price: 185.25, change: -8.75, changePercent: -4.51, volume: 950000, marketCap: '2.1L Cr' },
          { symbol: 'IOC', name: 'Indian Oil Corporation', price: 142.75, change: -6.25, changePercent: -4.19, volume: 1200000, marketCap: '1.3L Cr' },
          { symbol: 'COALINDIA', name: 'Coal India', price: 325.50, change: -13.50, changePercent: -3.98, volume: 800000, marketCap: '2.0L Cr' },
          { symbol: 'BPCL', name: 'Bharat Petroleum', price: 385.00, change: -15.25, changePercent: -3.81, volume: 750000, marketCap: '1.1L Cr' },
          { symbol: 'GAIL', name: 'GAIL India', price: 152.25, change: -5.75, changePercent: -3.64, volume: 650000, marketCap: '0.9L Cr' },
        ]);
      }, 500);
    });
  }
}

export default new BSEService();