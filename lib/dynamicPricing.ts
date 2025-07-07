import { addMinutes, differenceInMinutes, isWeekend, isWithinInterval } from 'date-fns';
import { BookingModel } from '@/schemas/booking';
import type { ParkingLocation } from '@/schemas/parking-locations';

type WeatherData = {
  condition: 'rain' | 'snow' | 'clear' | 'cloudy' | 'hot' | 'cold';
  temperatureC?: number;
};

const WORK_HOURS   = { start: 9, end: 18 };
const BASE_SURGE   = 0.20;
const DEMAND_STEP  = 0.10;
const DEMAND_THRESHOLD = 5;

/**
 * Utility helpers
 * --------------- */
const hoursBetween = (start: Date, end: Date) =>
  differenceInMinutes(end, start) / 60;

const isWorkingHours = (start: Date, end: Date) =>
  isWithinInterval(start, {
    start: new Date(start.setHours(WORK_HOURS.start, 0, 0, 0)),
    end:   new Date(start.setHours(WORK_HOURS.end,   0, 0, 0)),
  }) && isWithinInterval(end, {
    start: new Date(end.setHours(WORK_HOURS.start, 0, 0, 0)),
    end:   new Date(end.setHours(WORK_HOURS.end,   0, 0, 0)),
  });

/**
 * Main pricing function
 * --------------------- */
export async function calculateDynamicPrice(
  location: ParkingLocation,
  startTime: Date,
  endTime: Date,
  day: Date, 
  weather?: WeatherData
) {
  /* 1.  Base price (no surge) ------------------------------------------------ */
  const baseRate = location.price.hourly;   // ensure baseRate is a number
  const hours    = hoursBetween(startTime, endTime);
  const basePrice = baseRate * hours;

  /* 2.  Return early if location opted‑out ---------------------------------- */
  if (!location.dynamicPricing) {
    return { price: basePrice, surgeMultiplier: 1 };
  }



  /* 3.  Calculate rule‑based surge ------------------------------------------ */
  let surgeMultiplier = 1;

  if (weather) {
    const { condition, temperatureC } = weather;
  
    if (condition === 'rain' || condition === 'snow') {
      surgeMultiplier += 0.15;  // +15% for rain or snow
    }
  
    if (condition === 'hot' && temperatureC && temperatureC > 35) {
      surgeMultiplier += 0.10;  // +10% for very hot days
    }
  
    if (condition === 'cold' && temperatureC && temperatureC < 5) {
      surgeMultiplier += 0.10;  // +10% for very cold days
    }
  }

  const weekday = !isWeekend(day);
  const category = location.locationCategory;

  if (weekday) {
    if (isWorkingHours(startTime, endTime) && category === 'office' || category=='university' || category=='school') {
      surgeMultiplier += BASE_SURGE;           // office hours near offices
    }

    if (!isWorkingHours(startTime, endTime) &&
        (category === 'mall' || category === 'cinema' || category=='market')) {
      surgeMultiplier += BASE_SURGE;           // weeknight cinema/mall
    }
  } else {
    // weekend
    if (category === 'mall' || category === 'cinema' || category=='market') {
      surgeMultiplier += BASE_SURGE;           // all day Sat/Sun
    }
  }

  /* 4.  Demand‑based surge --------------------------------------------------- */
  const overlappingBookings = await BookingModel.countDocuments({
    locationid: location._id,
    bookingdate: {
      $gte: day,                      // 00:00 of the date
      $lt: addMinutes(day, 24 * 60),  // 23:59 of the date
    },
    // simplified “overlap” test: (start < endTime) && (end > startTime)
    starttime: { $lt: endTime },
    endtime:   { $gt: startTime },
    status: { $nin: ['CANCELLED', 'FAILED'] }, // ignore void bookings
  });

  if (overlappingBookings > DEMAND_THRESHOLD) {
    const extraBlocks = Math.ceil(
      (overlappingBookings - DEMAND_THRESHOLD) / DEMAND_THRESHOLD
    );
    surgeMultiplier += extraBlocks * DEMAND_STEP;          // +10 % per block
  }

  /* 5.  Compose final price -------------------------------------------------- */
  const dynamicPrice = +(basePrice * surgeMultiplier).toFixed(2);      // round to 2 dp

  return { price: dynamicPrice, surgeMultiplier };
}
