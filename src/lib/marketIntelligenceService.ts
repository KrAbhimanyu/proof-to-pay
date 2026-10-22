export interface GroundingSource {
  title: string;
  url: string;
}

export interface MarketTrendsResponse {
  success: boolean;
  text: string;
  sources: GroundingSource[];
  searchQueries: string[];
  timestamp: string;
  isLive: boolean;
  notice?: string;
}

export type MarketTrendTopic = 'skills' | 'rates' | 'startups' | 'opportunities' | 'custom';

export const marketIntelligenceService = {
  async fetchMarketTrends(topic: MarketTrendTopic = 'skills', customQuery?: string): Promise<MarketTrendsResponse> {
    try {
      const response = await fetch('/api/market-trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          query: customQuery,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data: MarketTrendsResponse = await response.json();
      return data;
    } catch (_err: any) {
      // Graceful client fallback without logging noisy error objects
      return {
        success: false,
        text: 'Unable to connect to market intelligence service. Please check your connection or try again later.',
        sources: [
          { title: 'NASSCOM Tech Talent Ecosystem Report', url: 'https://nasscom.in' },
          { title: 'Razorpay Emerging Talent Payout Trends', url: 'https://razorpay.com' },
        ],
        searchQueries: ['digital skills demand India', 'freelance rates INR'],
        timestamp: new Date().toISOString(),
        isLive: false,
        notice: 'Displaying offline benchmark insights.',
      };
    }
  },
};
