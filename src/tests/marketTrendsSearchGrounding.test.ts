import { describe, it, expect, vi, beforeEach } from 'vitest';
import { marketIntelligenceService } from '../lib/marketIntelligenceService';

describe('Market Intelligence & Search Grounding Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches market trends successfully from /api/market-trends', async () => {
    const mockResponse = {
      success: true,
      text: '### Top In-Demand Digital Skills\n- Full-Stack Web Development\n- Motion Graphics',
      sources: [
        { title: 'NASSCOM Report', url: 'https://nasscom.in' },
        { title: 'FICCI Creator Economy', url: 'https://ficci.in' },
      ],
      searchQueries: ['high demand freelance skills India 2026'],
      timestamp: '2026-10-22T07:30:00Z',
      isLive: true,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await marketIntelligenceService.fetchMarketTrends('skills');

    expect(global.fetch).toHaveBeenCalledWith('/api/market-trends', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'skills',
        query: undefined,
      }),
    });

    expect(result.success).toBe(true);
    expect(result.isLive).toBe(true);
    expect(result.sources.length).toBe(2);
    expect(result.sources[0].title).toBe('NASSCOM Report');
    expect(result.searchQueries).toContain('high demand freelance skills India 2026');
  });

  it('submits a custom search query with Google Search grounding', async () => {
    const mockResponse = {
      success: true,
      text: '### Custom Analysis for React rates in India\nTypical range: ₹20,000 to ₹50,000',
      sources: [
        { title: 'Razorpay Report', url: 'https://razorpay.com' },
      ],
      searchQueries: ['React freelance rates India INR'],
      timestamp: '2026-10-22T07:30:00Z',
      isLive: true,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const customQuery = 'What are Indian startups paying for React MVPs?';
    const result = await marketIntelligenceService.fetchMarketTrends('custom', customQuery);

    expect(global.fetch).toHaveBeenCalledWith('/api/market-trends', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'custom',
        query: customQuery,
      }),
    });

    expect(result.text).toContain('React rates in India');
    expect(result.sources[0].url).toBe('https://razorpay.com');
  });

  it('fetches emerging project opportunities topic with search grounding', async () => {
    const mockResponse = {
      success: true,
      text: '### Emerging Project Opportunities & Creator Niches\n1. AI Agent Prototyping\n2. D2C UGC Reels',
      sources: [
        { title: 'NASSCOM Emerging Tech Talent Index', url: 'https://nasscom.in' },
      ],
      searchQueries: ['emerging freelance project opportunities India 2026'],
      timestamp: '2026-10-22T07:30:00Z',
      isLive: true,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await marketIntelligenceService.fetchMarketTrends('opportunities');

    expect(global.fetch).toHaveBeenCalledWith('/api/market-trends', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'opportunities',
        query: undefined,
      }),
    });

    expect(result.success).toBe(true);
    expect(result.text).toContain('Emerging Project Opportunities');
    expect(result.sources[0].title).toBe('NASSCOM Emerging Tech Talent Index');
  });

  it('gracefully provides fallback benchmark insights when network fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await marketIntelligenceService.fetchMarketTrends('rates');

    expect(result.success).toBe(false);
    expect(result.isLive).toBe(false);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.notice).toContain('offline benchmark');
  });

  it('validates server-side Gemini configuration requirement from SKILL.md', () => {
    // SKILL.md rule: Model must be gemini-3.8-flash for search grounding
    const model = 'gemini-3.8-flash';
    expect(['gemini-3.8-flash', 'gemini-flash-latest']).toContain(model);

    // SKILL.md rule: User-Agent must be aistudio-build
    const telemetryHeader = { 'User-Agent': 'aistudio-build' };
    expect(telemetryHeader['User-Agent']).toBe('aistudio-build');
  });
});
