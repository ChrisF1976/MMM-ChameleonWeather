# MMM-ChameleonWeather

🦎 **MMM-ChameleonWeather** is a fun and visually dynamic [MagicMirror²](https://magicmirror.builders) module that shows a chameleon whose appearance changes depending on the temperature and weather conditions.

---

## Features

- 🐸 Chameleon image changes with temperature ranges
- 🌦 Weather overlay icons based on OpenWeatherMap `id` or `icon`
- 🌡 Optional temperature display (Celsius or Fahrenheit)
- 🔄 Periodic weather updates (default every 5 minutes)
- 🧩 Fully configurable image sets for both temperature and weather overlays

---

## Screenshot

*Insert a screenshot here showing the chameleon with weather overlay*

---

## Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/yourusername/MMM-ChameleonWeather.git
cd MMM-ChameleonWeather
```

Configuration

Add the module to your config.js file:

{
  module: "MMM-ChameleonWeather",
  position: "top_center", // Or any position you prefer
  config: {
    apiKey: "YOUR_OPENWEATHERMAP_API_KEY",
    lat: "YOUR_LATITUDE",
    lon: "YOUR_LONGITUDE",
    units: "metric", // or "imperial"
    updateInterval: 5 * 60 * 1000, // every 5 minutes
    showTemperature: true,
    width: "300px",
    weatherImagePath: "/image/weather/",
    temperatureRanges: [
      { range: [-Infinity, 0], image: "/image/frog/chameleon_below0.png" },
      { range: [0, 10], image: "/image/frog/chameleon_to10.png" },
      { range: [10, 20], image: "/image/frog/chameleon_to20.png" },
      { range: [20, 30], image: "/image/frog/chameleon_to30.png" },
      { range: [30, Infinity], image: "/image/frog/chameleon_above30.png" }
    ]
  }
}
