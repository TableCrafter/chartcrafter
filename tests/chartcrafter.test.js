import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../assets/js/chartcrafter.js';

describe('ChartCrafter', () => {
  let container;

  beforeEach(() => {
    // Setup a DOM container
    document.body.innerHTML = '<div id="chart-container"></div>';
    container = document.getElementById('chart-container');
    
    // Mock Chart.js global
    global.Chart = vi.fn().mockImplementation(() => ({
      destroy: vi.fn(),
      update: vi.fn(),
    }));
  });

  it('should initialize correctly with a selector', () => {
    const cc = new ChartCrafter('#chart-container', {
      source: 'https://example.com/data.json'
    });
    expect(cc.container).toBe(container);
    expect(cc.isLoading).toBe(true);
    expect(container.innerHTML).toContain('chc-loading');
  });

  it('should throw error if container not found', () => {
    expect(() => new ChartCrafter('#non-existent')).toThrow('Container element not found');
  });

  it('should handle successful async data fetching', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ labels: ["B"], data: [20] })
    });

    const cc = new ChartCrafter('#chart-container', {
      source: 'https://example.com/data.json'
    });

    // Wait for the async task queue
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(cc.data).toEqual({ labels: ["B"], data: [20] });
    expect(global.Chart).toHaveBeenCalled();
  });

  it('should use AJAX proxy when configured', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { labels: ["C"], data: [30] } })
    });

    const cc = new ChartCrafter('#chart-container', {
      source: 'https://example.com/data.json',
      api: {
        proxy: { url: '/wp-admin/admin-ajax.php', nonce: '123' }
      }
    });

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(global.fetch).toHaveBeenCalledWith('/wp-admin/admin-ajax.php', expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData)
    }));
    
    expect(cc.data).toEqual({ labels: ["C"], data: [30] });
  });

  it('should render error on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404
    });

    const cc = new ChartCrafter('#chart-container', {
      source: 'https://example.com/data.json'
    });

    // We catch the error that loadData re-throws
    try {
      await cc.loadData();
    } catch (e) {
      // Expected
    }

    expect(container.innerHTML).toContain('chc-error-state');
    expect(container.innerHTML).toContain('HTTP error! status: 404');
  });
});
