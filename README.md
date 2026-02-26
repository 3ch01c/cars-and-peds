# Cars vs Peds

This app is an interactive scatter plot comparing countries by:

- `x-axis`: passenger car ownership rate (cars per 1,000 people)
- `y-axis`: pedestrian road fatality rate (pedestrian deaths per 100,000 people)

Each point is a country. Points are color-coded by region, and bubble size scales with population.

## What It Shows

The chart is designed to help you compare how pedestrian safety relates to car ownership across countries and regions.

You can use it to spot patterns and outliers, such as:

- countries with low car ownership but high pedestrian fatality rates
- wealthy countries with similar car ownership but different safety outcomes
- regional clustering and differences in outcomes

## Interactions

- Hover a country to see a tooltip with country name, region, car ownership, pedestrian fatality rate, and population
- Filter countries by region using the region buttons
- Use Select All / Deselect All to quickly reset regional filters

## Data Notes

- Pedestrian fatality rates are based on WHO road safety reporting (with some WHO estimates)
- Car ownership values are based on World Bank / OICA vehicle registration data (nearest available year, around 2021)
- Values are intended for cross-country comparison and visualization, not precise causal analysis

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy (GitHub Pages)

```bash
npm run deploy
```
