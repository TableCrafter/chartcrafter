/**
 * ChartCrafter - JSON to Beautiful Charts
 * A lightweight, professional wrapper around Chart.js for JSON-to-chart rendering.
 * 
 * @version 1.1.0
 * @author Crafter Suite Team
 * @license GPLv2 or later
 */

class ChartCrafter {
  constructor(container, config = {}) {
    console.log('ChartCrafter: Initializing for', container);
    
    // Handle container parameter
    this.container = this.resolveContainer(container);
    if (!this.container) {
      throw new Error('Container element not found');
    }

    // Default configuration
    this.config = Object.assign({
      source: null,
      type: 'bar',
      height: 400,
      title: '',
      responsive: true,
      maintainAspectRatio: false,
      fields: {
        labels: 'labels',
        data: 'data',
        datasets: 'datasets'
      },
      api: {
        proxy: null // { url, nonce }
      },
      colors: [
        'rgba(59, 130, 246, 0.8)',   // Blue
        'rgba(16, 185, 129, 0.8)',   // Green
        'rgba(245, 158, 11, 0.8)',   // Amber
        'rgba(239, 68, 68, 0.8)',    // Red
        'rgba(139, 92, 246, 0.8)',   // Purple
        'rgba(236, 72, 153, 0.8)',   // Pink
        'rgba(20, 184, 166, 0.8)',   // Teal
        'rgba(251, 146, 60, 0.8)',   // Orange
        'rgba(34, 197, 94, 0.8)',    // Emerald
        'rgba(99, 102, 241, 0.8)'    // Indigo
      ]
    }, config);

    // Internal state
    this.data = null;
    this.chart = null;
    this.isLoading = false;
    this.dataUrl = this.config.source;

    this.init();
  }

  /**
   * Resolve container from selector or element.
   */
  resolveContainer(container) {
    if (typeof container === 'string') {
      return document.querySelector(container);
    } else if (container && container.nodeType === 1) {
      return container;
    }
    return null;
  }

  /**
   * Initialize the chart lifecycle.
   */
  init() {
    // SWR Hydration: Check for embedded data BEFORE overwriting innerHTML
    const initialDataScript = this.container.querySelector('.chc-initial-data');
    if (initialDataScript) {
      try {
        this.data = JSON.parse(initialDataScript.textContent);
        console.log('ChartCrafter: Initialized from embedded data payload');
        this.renderChart(this.data);
        return;
      } catch (e) {
        console.error('ChartCrafter: Failed to parse embedded data', e);
      }
    }

    this.container.innerHTML = '<div class="chc-loading"><div class="chc-spinner"></div><p>Loading chart...</p></div>';

    if (this.dataUrl) {
      this.loadData();
    }
  }

  /**
   * Load data from URL with Proxy support.
   */
  async loadData() {
    this.isLoading = true;
    
    try {
      let response;
      if (this.config.api && this.config.api.proxy && this.config.api.proxy.url) {
        const formData = new FormData();
        formData.append('action', 'chc_proxy_fetch');
        formData.append('url', this.dataUrl);
        formData.append('nonce', this.config.api.proxy.nonce);
        
        response = await fetch(this.config.api.proxy.url, {
          method: 'POST',
          body: formData
        });
      } else {
        response = await fetch(this.dataUrl);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      const data = json.success !== undefined ? (json.success ? json.data : null) : json;

      if (json.success === false) {
        throw new Error(json.data || 'Unknown proxy error');
      }

      if (!data) {
        throw new Error('No data found in response');
      }

      this.data = data;
      this.isLoading = false;
      this.renderChart(data);
      return data;
    } catch (error) {
      this.isLoading = false;
      console.error('ChartCrafter: Data fetch failed:', error);
      this.renderError(error.message);
      throw error;
    }
  }

  /**
   * Render Chart using Chart.js.
   */
  renderChart(data) {
    if (typeof Chart === 'undefined') {
      this.renderError('Chart.js library not loaded.');
      return;
    }

    // Clear container
    this.container.innerHTML = '';
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.style.height = this.config.height + 'px';
    canvas.style.width = '100%';
    this.container.appendChild(canvas);

    const chartData = this.prepareChartData(data);
    
    this.chart = new Chart(canvas, {
      type: this.config.type,
      data: chartData,
      options: {
        responsive: this.config.responsive,
        maintainAspectRatio: this.config.maintainAspectRatio,
        plugins: {
          title: {
            display: !!this.config.title,
            text: this.config.title
          }
        }
      }
    });
  }

  /**
   * Prepare data for Chart.js format.
   */
  prepareChartData(data) {
    const fields = this.config.fields;
    let labels = [];
    let datasets = [];

    // Option A: Complex datasets structure
    const complexDatasets = this.getNestedValue(data, fields.datasets);
    if (complexDatasets && Array.isArray(complexDatasets)) {
      labels = this.getNestedValue(data, fields.labels) || [];
      datasets = complexDatasets.map((ds, i) => {
        return Object.assign({
          label: ds.label || 'Dataset ' + (i + 1),
          data: ds.data || [],
          backgroundColor: this.config.colors[i % this.config.colors.length],
          borderColor: this.config.colors[i % this.config.colors.length].replace('0.8', '1'),
          borderWidth: 1
        }, ds);
      });
    } else {
      // Option B: Simple flat structure
      labels = this.getNestedValue(data, fields.labels) || [];
      const flatData = this.getNestedValue(data, fields.data) || [];
      
      datasets = [{
        label: this.config.title || 'Data',
        data: flatData,
        backgroundColor: this.config.type === 'pie' || this.config.type === 'doughnut' || this.config.type === 'polarArea' 
          ? this.config.colors 
          : this.config.colors[0],
        borderColor: this.config.type === 'pie' || this.config.type === 'doughnut' || this.config.type === 'polarArea'
          ? this.config.colors.map(c => c.replace('0.8', '1'))
          : this.config.colors[0].replace('0.8', '1'),
        borderWidth: 1
      }];
    }

    return {
      labels: labels,
      datasets: datasets
    };
  }

  /**
   * Get nested value from object.
   */
  getNestedValue(obj, path) {
    if (!path) return null;
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }
    return value;
  }

  /**
   * Render Error state.
   */
  renderError(message) {
    this.container.innerHTML = `
      <div class="chc-error-state" style="padding: 40px; text-align: center; border: 1px solid #fee2e2; background: #fef2f2; border-radius: 8px;">
        <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
        <h3 style="margin: 0 0 10px 0; color: #991b1b;">Unable to load chart</h3>
        <p style="margin: 0 0 20px 0; color: #b91c1c; font-size: 14px;">${message}</p>
        <button class="chc-retry-button" style="background: #991b1b; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: 600;">
          Retry Loading
        </button>
      </div>
    `;

    const retryBtn = this.container.querySelector('.chc-retry-button');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.init());
    }
  }
}

// Global exposure
if (typeof window !== 'undefined') {
  window.ChartCrafter = ChartCrafter;
}
