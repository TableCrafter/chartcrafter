# ChartCrafter

[![License](https://img.shields.io/badge/License-GPL%20v2-blue.svg?style=flat-square)](https://www.gnu.org/licenses/gpl-2.0.html)

Lightweight JavaScript library that wraps Chart.js to render any JSON data source into interactive, responsive charts with minimal configuration.

## Installation

Include after Chart.js in your project or WordPress theme:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="chartcrafter.js"></script>
```

## Usage

```js
new ChartCrafter('#my-chart', {
  source: 'https://example.com/data.json',
  type: 'bar',
  height: 400,
  title: 'Monthly Sales'
});
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `source` | string | `null` | URL of your JSON data (required) |
| `type` | string | `'bar'` | Chart type: `bar`, `line`, `pie`, `doughnut`, `radar`, `polarArea` |
| `height` | number | `400` | Chart height in pixels |
| `title` | string | `''` | Chart title |
| `responsive` | boolean | `true` | Make chart responsive |

## JSON Data Format

Simple format (single series):

```json
{
  "labels": ["Jan", "Feb", "Mar"],
  "data": [120, 190, 150]
}
```

Multi-series format:

```json
{
  "labels": ["Jan", "Feb", "Mar"],
  "datasets": [
    { "label": "Revenue", "data": [120, 190, 150] },
    { "label": "Costs",   "data": [80,  100, 90]  }
  ]
}
```

## Tests

```bash
npm install
npm test
```

## License

GPL v2 or later.

---

Part of the Crafter plugin family by [TableCrafter](https://github.com/TableCrafter).
