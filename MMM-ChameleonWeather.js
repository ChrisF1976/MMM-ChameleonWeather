Module.register("MMM-ChameleonWeather", {
  defaults: {
    apiKey: "", // OpenWeatherMap API Key
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
    this.imagePath = ""; // Current image path for the main image
    // Set a default overlay image (this will be used if no valid weather image is found)
    this.weatherOverlayPath = `modules/MMM-ChameleonWeather${this.config.weatherImagePath}na.png`;
    this.weatherWhinerText = ""; // Placeholder for weather whiner text
    this.messages = {}; // Placeholder for weather messages
    this.loadMessages();
    this.sendSocketNotification("FETCH_ChameleonWEATHER", this.config);

    // Set up periodic updates
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
        // Optionally log error: console.error("Error loading weather messages:", error);
      });
  },

  getStyles: function () {
    return ["MMM-ChameleonWeather.css"];
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.className = "chameleon-wrapper";

    // Ensure the wrapper is centered
    wrapper.style.width = this.config.width;
    wrapper.style.margin = "0 auto";

    // Main chameleon image
      const img = document.createElement("img");
	  img.className = "chameleon-image";
	  img.src = this.imagePath || "modules/MMM-ChameleonWeather/image/frog/default.png";
	  img.style.width = this.config.width_image;  // Use the new property
	  img.style.height = "auto";
	  img.style.marginLeft = "auto"; // Aligns the image to the right within the module
	  wrapper.appendChild(img);

    // Weather overlay
    if (this.weatherOverlayPath) {
      const overlay = document.createElement("img");
      overlay.className = "weather-overlay";
      overlay.src = this.weatherOverlayPath;
      overlay.style.display = "block";
      // If the image fails to load (file not found), hide the overlay.
      overlay.onerror = function () {
        this.style.display = "none";
      };
      wrapper.appendChild(overlay);
    }
//Temperature Display
	if (this.config.showTemperature && this.temperature !== null) {
 	const tempDiv = document.createElement("div");
	tempDiv.className = "temperature-display";
  
 	tempDiv.textContent = `${this.temperature.toFixed(1)}°${
   	this.config.units === "imperial" ? "F" : "C"
 	}`;
  	wrapper.appendChild(tempDiv);
	}

// Weather whiner message
  const whinerElement = document.createElement("div");
  whinerElement.className = "weather-whiner";
  whinerElement.textContent = this.weatherWhinerText || "";
  // Ensure maximum font size and single-line text
  whinerElement.style.fontSize = "20px";
  whinerElement.style.whiteSpace = "nowrap";
  wrapper.appendChild(whinerElement);

  // Adjust the font size to fit within the module's width
  // Use a timeout to ensure the element is rendered before measuring
  setTimeout(() => {
    let fontSize = 20;
    // Reduce font size until the whiner text fits inside the module wrapper
    while (whinerElement.scrollWidth > wrapper.clientWidth && fontSize > 5) {
      fontSize--;
      whinerElement.style.fontSize = fontSize + "px";
    }
  }, 0);

    return wrapper;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "ChameleonWEATHER_DATA") {
      if (payload && typeof payload.temperature !== "undefined") {
        this.temperature = payload.temperature;
        this.updateImage();
        this.updateWeatherOverlay(payload.weather);

        // Select a random weather whiner message based on the condition
        const description = payload.weather[0]?.main || "Clear";
        const whineList =
          this.messages[description] ||
          ["The weather is boring. Move somewhere else."];
        const currentWhine =
          whineList[Math.floor(Math.random() * whineList.length)];

        this.weatherWhinerText = currentWhine;
        this.updateDom(); // Refresh the DOM
      }
    }
  },

  updateImage: function () {
    if (this.temperature !== null) {
      const rangeConfig = this.config.temperatureRanges.find(
        (rangeObj) =>
          this.temperature >= rangeObj.range[0] &&
          this.temperature < rangeObj.range[1]
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
	  // Reset the overlay path
	  this.weatherOverlayPath = "";
	
	  if (weatherData && Array.isArray(weatherData) && weatherData.length > 0) {
	    const weather = weatherData[0];
	
	    let imageFile = "";
	    if (weather.id) {
	      imageFile = `${weather.id}.png`;
	    } else if (weather.icon) {
	      imageFile = `${weather.icon}.png`;
	    }
	
	    if (imageFile) {
	      const testImage = new Image();
	      testImage.onload = () => {
	        // File exists, use it.
	        this.weatherOverlayPath = `modules/MMM-ChameleonWeather${weatherPath}${imageFile}`;
	        this.updateDom();
	      };
	      testImage.onerror = () => {
	        // File doesn't exist, try using weather.icon if it's different.
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
