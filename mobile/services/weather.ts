const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';

export interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
}

export async function fetchWeather(lat: number = 40.7128, lon: number = -74.0060): Promise<WeatherData> {
  // Default to New Delhi coordinates if none provided
  if (!OPENWEATHER_API_KEY) {
    console.warn("No OpenWeather API key found in .env. Using mock weather data.");
    return { temp: 28, condition: 'Sunny', icon: 'sunny' };
  }

  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`);
    const data = await res.json();
    
    if (!res.ok || !data.main) {
      console.warn("Weather API returned an error:", data.message || "Unknown error");
      return { temp: 22, condition: 'Clear', icon: 'sunny' }; // Sensible default
    }

    return {
      temp: Math.round(data.main.temp),
      condition: data.weather[0].main,
      icon: mapWeatherIcon(data.weather[0].icon),
    };
  } catch (e) {
    console.error("Weather API fetch failed:", e);
    return { temp: 25, condition: 'Unknown', icon: 'cloud' };
  }
}

function mapWeatherIcon(code: string) {
  if (code.includes('01')) return 'sunny';
  if (code.includes('02') || code.includes('03') || code.includes('04')) return 'partly-sunny';
  if (code.includes('09') || code.includes('10')) return 'rainy';
  if (code.includes('11')) return 'thunderstorm';
  if (code.includes('13')) return 'snow';
  return 'cloudy';
}
