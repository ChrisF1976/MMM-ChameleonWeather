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
    // Updated to OpenWeatherMap API 3.0
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${config.lat}&lon=${config.lon}&units=${config.units}&appid=${config.apiKey}&exclude=minutely,hourly,daily,alerts`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        // Try to get error details
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
      }

      const data = await response.json();

      if (data && data.current) {
        this.sendSocketNotification("ChameleonWEATHER_DATA", {
          temperature: data.current.temp,
          weather: data.current.weather,
          units: config.units
        });
      } else {
        throw new Error("Invalid API response structure");
      }
    } catch (error) {
      console.error(
        "MMM-ChameleonWeather: Error fetching weather data:",
        error.message
      );
      
      // Send error notification to main module
      this.sendSocketNotification("ChameleonWEATHER_ERROR", {
        message: error.message
      });
    }
  }
});
