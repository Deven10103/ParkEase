// /actions/dynamicPrice.ts         ← new file
'use server'

import { ParkingLocation, ParkingLocationModel } from '@/schemas/parking-locations'
import { calculateDynamicPrice } from '@/lib/dynamicPricing'
import { getWeatherCondition } from '@/lib/getWeather'

/**
 * Returns the dynamic price (+ the surge amount in case you want to display it)
 */
export async function getDynamicPrice(
  locationId: string,
  date: string,          // "2025‑07‑15"
  start: string,         // "09:00"
  end: string            // "12:30"
) {
  // 1.  Pull the location
  const location = await ParkingLocationModel.findById(locationId).lean() as unknown as ParkingLocation
  if (!location) throw new Error('Location not found')

  // 2.  Build the Date objects expected by the helper
  const startTime = new Date(`${date}T${start}`)
  const endTime   = new Date(`${date}T${end}`)
  const dayMidnight = new Date(date)           // e.g. 2025‑07‑15 00:00
  const { condition, temperatureC } = await getWeatherCondition(
    location.gpscoords.lat,
    location.gpscoords.lng
  );

  // 3.  Ask the pricing engine
  const { price, surgeMultiplier } = await calculateDynamicPrice(
    location,
    startTime,
    endTime,
    dayMidnight,
    { condition, temperatureC }
  )

  // You may also want to show the absolute “surge ₹ amount”
  const hours = (endTime.getTime() - startTime.getTime()) / 3.6e6
  const base  = location.price.hourly * hours
  const surgeAmount = +(price - base).toFixed(2)

  return { price, surgeAmount, surgeMultiplier }
}
