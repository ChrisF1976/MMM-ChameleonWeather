const NodeHelper = require("node_helper");
const axios = require("axios");

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
      const response = await axios.get(url);
      const data = response.data;
      
      /*
      console.log("Sending weather data:", {
        temperature: data.main.temp,
        weather: data.weather[0], // Sending the entire weather object
      });
      */

      this.sendSocketNotification("ChameleonWEATHER_DATA", {
        temperature: data.main.temp,
        weather: data.weather, // Send full array of weather objects
      });
    } catch (error) {
      console.error("MMM-ChameleonWeather: Error fetching weather data:", error);
    }
  },
});
