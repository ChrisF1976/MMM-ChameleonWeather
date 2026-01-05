const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  start: function () {
    console.log("Starting node_helper for: MMM-ChameleonWeather");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "FETCH_ChameleonWEATHER") {
      this.fetchWeather(payload);
    }
  },

  fetchWeather: async function (config) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${config.lat}&lon=${config.lon}&units=${config.units}&appid=${config.apiKey}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      this.sendSocketNotification("ChameleonWEATHER_DATA", {
        temperature: data.main.temp,
        weather: data.weather,
        units: config.units
      });
    } catch (error) {
      console.error(
        "MMM-ChameleonWeather: Error fetching weather data:",
        error
      );
    }
  }
});

