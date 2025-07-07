import { get } from "node:http";
import { run } from "node:test";

const WEATHERAPI_KEY = process.env.WEATHERAPI_KEY;

type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'snow' | 'hot' | 'cold';

export async function getWeatherCondition(
  lat: number,
  lon: number
): Promise<{ condition: WeatherCondition; temperatureC: number }> {
  if (!WEATHERAPI_KEY) {
    throw new Error('Missing WEATHERAPI_KEY in environment variables');
  }

  const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHERAPI_KEY}&q=${lat},${lon}`;
  console.log('Fetching from WeatherAPI:', url);

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error('Weather API error:', text);
    throw new Error('Failed to fetch weather data');
  }

  const data = await res.json();

  const temp = data.current.temp_c;
  const description = data.current.condition.text.toLowerCase();

  let condition: WeatherCondition = 'clear';

  if (description.includes('rain')) condition = 'rain';
  else if (description.includes('snow')) condition = 'snow';
  else if (description.includes('cloud')) condition = 'cloudy';
  else if (temp > 35) condition = 'hot';
  else if (temp < 5) condition = 'cold';

  console.log(`Weather condition: ${condition}, Temperature: ${temp}°C`);

  return {
    condition,
    temperatureC: temp,
  };
}