import { Library } from "@googlemaps/js-api-loader"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { compareAsc, differenceInMinutes, getHours, getMinutes } from "date-fns"
import { Booking } from "@/schemas/booking"

export const libs: Library[] = ['core', 'maps', 'places', 'marker']

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatAmountForDisplay(
  amount: number, currency: string
): string {

  let numberFormat = new Intl.NumberFormat(['en-us'], {
    style:'currency',
    currency: currency,
    currencyDisplay: 'symbol'
  })

  const formatedAmount = numberFormat.format(amount)
  return formatedAmount === 'NaN' ? '' : formatedAmount
}

export function formatAmountForStripe(
  amount: number,
  currency: string
): number {

  let numberFormat = new Intl.NumberFormat(['en-US'], {
    style:'currency',
    currency: currency,
    currencyDisplay: 'symbol'
  })

  const parts = numberFormat.formatToParts(amount)
  let zeroDecimalCurrency: boolean = true

  for (let part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false
    }
  }

  return zeroDecimalCurrency ? amount : Math.round(amount * 100)
}


export function getStreetFromAddress(address: string) {
  return address.split(',')[0]
}

/// google maps
export const buildMapInfoCardContent = (title: string, address: string, totalSpots: number, price: number)
: string => {

  return `
    <div class="map_infocard_content">
      <div class="map_infocard_title">${title}</div>
      <div class="map_infocard_body">
      <div>${address}</div>
      <hr />
      <div>Total spots: ${totalSpots}</div>
      <div>Hourly price: ${formatAmountForDisplay(price, 'INR')}</div>
      </div>
      
  </div>
  `
}

export const buildMapInfoCardContentForDestination = (title: string, address: string): string => {
  return `
  <div class="map_infocard_content">
      <div class="map_infocard_title">${title}</div>
      <div class="map_infocard_body">
      <div>${address}</div>
      </div>
      
  </div>`;
}

export const parkingPin = (type: string) => {
  const glyphImg = document.createElement('div')
  glyphImg.innerHTML = `
    <div class="map_pin_container">
      <img src='/${type}.png' />
    </div>
  `

  const pinElement = new google.maps.marker.PinElement({
    glyph: glyphImg
  })

  return pinElement
}

export const parkingPinWithIndex = (type: string, index: number) => {
  const glyphImg = document.createElement('div')
  glyphImg.innerHTML = `
    <div class="map_pin_container">
      <div class="map_pin_id"><span>${index}</span></div>
      <img src='/${type}.png' />
    </div>
  `

  const pinElement = new google.maps.marker.PinElement({
    glyph: glyphImg
  })

  return pinElement
}

export const destinationPin = (type: string) => {
  const glyphImg = document.createElement('img');
  glyphImg.src = `/${type}.png`;
  const pinElement = new google.maps.marker.PinElement({
      glyph: glyphImg
  })

  return pinElement
}

type ReturnType = {
  time: string // in HH:mm 24-hour format
  display: string // in 12-hour format with AM/PM
}

export function getTimeSlots(startTime = "00:00", endTime = "23:45"): ReturnType[] {
  const timeArray: ReturnType[] = []
  const parsedStartTime: Date = new Date(`2000-01-01T${startTime}:00`)
  const parsedEndTime: Date = new Date(`2000-01-01T${endTime}:00`)

  let currentTime: Date = new Date(parsedStartTime)

  while (currentTime <= parsedEndTime) {
    const hours24 = currentTime.getHours()
    const minutes = currentTime.getMinutes().toString().padStart(2, "0")

    // Convert to 12-hour format
    let hours12 = hours24 % 12
    if (hours12 === 0) hours12 = 12
    const ampm = hours24 < 12 ? "AM" : "PM"

    const time = `${hours24.toString().padStart(2, "0")}:${minutes}`
    const display = `${hours12}:${minutes} ${ampm}`

    timeArray.push({ time, display })

    currentTime.setMinutes(currentTime.getMinutes() + 30)
  }

  return timeArray
}


export function sortcomparer(b1: Booking, b2: Booking) {
  return compareAsc(b1.starttime, b2.starttime)
}

export function blockLength(starttime: Date, endtime: Date) {
  return differenceInMinutes(endtime, starttime)
}

export function blockPostion(starttime: Date) {
  const h = getHours(starttime)
  const m = getMinutes(starttime)
  return (h * 60) + m
}