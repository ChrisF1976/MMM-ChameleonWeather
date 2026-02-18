Module.register("MMM-ChameleonWeather", {
  defaults: {
    apiKey: "", // OpenWeatherMap API Key (v3.0)
    lat: "", // Latitude
    lon: "", // Longitude
    units: "metric", // Units: metric or imperial
    updateInterval: 5 * 60 * 1000, // Update interval in milliseconds (default: 5 minutes)
    useWeatherMapping: true,
    showTemperature: true, // Show temperature on the screen
    width: "300px",
    width_image: "150px",
    temperatureRanges: [
      { range: [-Infinity, 0], image: "/image/frog/chameleon_below0.png" },
      { range: [0, 10], image: "/image/frog/chameleon_to10.png" },
      { range: [10, 20], image: "/image/frog/chameleon_to20.png" },
      { range: [20, 30], image: "/image/frog/chameleon_to30.png" },
      { range: [30, Infinity], image: "/image/frog/chameleon_above30.png" },
    ],
    weatherImagePath: "/image/weather/",
    language: "en" // Default language
  },

  start: function () {
    this.temperature = null;
    this.imagePath = "";
    this.weatherOverlayPath = `modules/MMM-ChameleonWeather${this.config.weatherImagePath}na.png`;
    this.weatherWhinerText = "";
    this.messages = {};
    this.errorMessage = ""; // Add error message storage
    this.loadMessages();
    this.sendSocketNotification("FETCH_ChameleonWEATHER", this.config);

    setInterval(() => {
      this.sendSocketNotification("FETCH_ChameleonWEATHER", this.config);
    }, this.config.updateInterval);
  },

  loadMessages: function () {
    const self = this;
    fetch(`modules/MMM-ChameleonWeather/weatherMessages_${this.config.language}.json`)
      .then((response) => response.json())
      .then((data) => {
        self.messages = data;
      })
      .catch((error) => {
        console.error("Error loading weather messages:", error);
      });
  },

  getStyles: function () {
    return ["MMM-ChameleonWeather.css"];
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.className = "chameleon-wrapper";
    wrapper.style.width = this.config.width;
    wrapper.style.margin = "0 auto";

    // Show error if exists
    if (this.errorMessage) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "error-message";
      errorDiv.textContent = this.errorMessage;
      errorDiv.style.color = "red";
      errorDiv.style.fontSize = "12px";
      wrapper.appendChild(errorDiv);
    }

    // Main chameleon image
    const img = document.createElement("img");
    img.className = "chameleon-image";
    img.src = this.imagePath || "modules/MMM-ChameleonWeather/image/frog/default.png";
    img.style.width = this.config.width_image;
    img.style.height = "auto";
    img.style.marginLeft = "auto";
    wrapper.appendChild(img);

    // Weather overlay
    if (this.weatherOverlayPath) {
      const overlay = document.createElement("img");
      overlay.className = "weather-overlay";
      overlay.src = this.weatherOverlayPath;
      overlay.style.display = "block";
      overlay.onerror = function () {
        this.style.display = "none";
      };
      wrapper.appendChild(overlay);
    }

    // Temperature display - FIXED: No conversion needed
    if (this.config.showTemperature && this.temperature !== null) {
      const tempDiv = document.createElement("div");
      tempDiv.className = "temperature-display";
      
      // API v3.0 returns correct units, no conversion needed
      const unitSymbol = this.config.units === "imperial" ? "F" : "C";
      tempDiv.textContent = `${this.temperature.toFixed(1)}°${unitSymbol}`;
      wrapper.appendChild(tempDiv);
    }

    // Weather whiner message
    const whinerElement = document.createElement("div");
    whinerElement.className = "weather-whiner";
    whinerElement.textContent = this.weatherWhinerText || "";
    whinerElement.style.fontSize = "20px";
    whinerElement.style.whiteSpace = "nowrap";
    wrapper.appendChild(whinerElement);

    setTimeout(() => {
      let fontSize = 20;
      while (whinerElement.scrollWidth > wrapper.clientWidth && fontSize > 5) {
        fontSize--;
        whinerElement.style.fontSize = fontSize + "px";
      }
    }, 0);

    return wrapper;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "ChameleonWEATHER_DATA") {
      this.errorMessage = ""; // Clear any previous errors
      if (payload && typeof payload.temperature !== "undefined") {
        this.temperature = payload.temperature;
        this.config.units = payload.units || this.config.units; // Update units
        this.updateImage();
        this.updateWeatherOverlay(payload.weather);

        const description = payload.weather[0]?.main || "Clear";
        const whineList = this.messages[description] || ["The weather is boring. Move somewhere else."];
        const currentWhine = whineList[Math.floor(Math.random() * whineList.length)];

        this.weatherWhinerText = currentWhine;
        this.updateDom();
      }
    } else if (notification === "ChameleonWEATHER_ERROR") {
      this.errorMessage = payload.message || "Error fetching weather data";
      this.updateDom();
    }
  },

  updateImage: function () {
    if (this.temperature !== null) {
      // IMPORTANT: Temperature ranges are in Celsius format
      // If user uses imperial, we need to convert to Celsius for image selection
      let tempForImage = this.temperature;
      
      if (this.config.units === "imperial") {
        // Convert Fahrenheit to Celsius for image selection
        tempForImage = (this.temperature - 32) * 5/9;
      }
      
      const rangeConfig = this.config.temperatureRanges.find(
        (rangeObj) =>
          tempForImage >= rangeObj.range[0] &&
          tempForImage < rangeObj.range[1]
      );

      if (rangeConfig) {
        this.imagePath = `modules/MMM-ChameleonWeather${rangeConfig.image}`;
      } else {
        this.imagePath = "modules/MMM-ChameleonWeather/image/frog/default.png";
      }
    }
  },

  updateWeatherOverlay: function (weatherData) {
    const weatherPath = this.config.weatherImagePath;
    this.weatherOverlayPath = "";

    if (weatherData && Array.isArray(weatherData) && weatherData.length > 0) {
      const weather = weatherData[0];

      let imageFile = "";
      if (weather.icon) {
        imageFile = `${weather.icon}.png`;
      } else if (weather.id) {
        imageFile = `${weather.id}.png`;
      }

      if (imageFile) {
        const testImage = new Image();
        testImage.onload = () => {
          this.weatherOverlayPath = `modules/MMM-ChameleonWeather${weatherPath}${imageFile}`;
          this.updateDom();
        };
        testImage.onerror = () => {
          if (weather.icon && imageFile !== `${weather.icon}.png`) {
            this.weatherOverlayPath = `modules/MMM-ChameleonWeather${weatherPath}${weather.icon}.png`;
            this.updateDom();
          }
        };
        testImage.src = `modules/MMM-ChameleonWeather${weatherPath}${imageFile}`;
      }
    }
  }
});
