'use server'

import EmailTemplate from "@/components/email-template"
import { SearchParams } from "@/components/search-component"
import ViolationEmailTemplate from "@/components/violation-email-template"
import { connectToDB } from "@/lib/db"
import { Booking, BookingModel } from "@/schemas/booking"
import { ParkingLocation, ParkingLocationModel } from "@/schemas/parking-locations"
import { ActionResponse, BookingStatus, ParkingLocationStatus, UpdateLocationParams } from "@/types"
import { currentUser } from "@clerk/nextjs/server"
import { compareAsc, format, formatDate } from "date-fns"
import { revalidatePath } from "next/cache"
import { Resend } from 'resend'

import nodemailer from "nodemailer"
import { render } from "@react-email/render"


const resend = new Resend(process.env.RESEND_API_KEY)

export async function toggleLocation({ id, path }: {
    id: string, path: string
}) {

    await connectToDB()

    const location = await ParkingLocationModel.findById<ParkingLocation>(id)

    if (location) {
        location.status = location.status === ParkingLocationStatus.AVAILABLE
            ? ParkingLocationStatus.NOTAVAILABLE : ParkingLocationStatus.AVAILABLE

        const result = await location.save()

        if (result) {
            revalidatePath(path)
        }
    }
}

export async function deleteLocation({ id, path }: {
    id: string, path: string
}) {

    await connectToDB()

    const deleteResult = await ParkingLocationModel.findByIdAndDelete(id)

    if (deleteResult) {
        revalidatePath(path)
    }
}


export async function updateLocation({ id, path, location }: {
    id: string, path: string, location: UpdateLocationParams
}) {

    try {
        await connectToDB()

        const result = await ParkingLocationModel.updateOne({
            _id: id
        }, {
            $set: location
        })

        revalidatePath(path)
    } catch (error) {
        console.log(error)
        throw error
    }

}

export async function findNearbyLocations(maxDistance: number, searchParams: SearchParams) {

    try {

        await connectToDB()

        const st = new Date(`${searchParams.arrivingon}T${searchParams.arrivingtime}`)
        const et = new Date(`${searchParams.arrivingon}T${searchParams.leavingtime}`)

        const parkingLocations= await ParkingLocationModel.find({
            location: {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [searchParams.gpscoords.lng, searchParams.gpscoords.lat]
                    },
                    $maxDistance: maxDistance // meters
                }
            },
            status: ParkingLocationStatus.AVAILABLE,
        }).lean() as unknown as ParkingLocation[]

        // go through all locations and find the bookings for it
        const availableLocations =
            await Promise.all(parkingLocations.map(async (location: ParkingLocation) => {

                const bookings = await BookingModel.find({
                    locationid: location._id,
                    status: BookingStatus.BOOKED,
                    starttime: {
                        $lt: et
                    },
                    endtime: {
                        $gt: st
                    }
                }).lean()

                if (bookings.length < location.numberofspots) {
                    return { ...location, ...{ bookedspots: bookings.length } }
                } else
                    return { ...location, ...{ bookedspots: bookings.length, status: ParkingLocationStatus.FULL } }
            }))

        return JSON.parse(JSON.stringify(availableLocations))

    } catch (error) {
        console.log(error)
        throw error
    }
}

export async function getParkingLocation(
    id: string
) {
    try {

        connectToDB()

        const location = await ParkingLocationModel.findById<ParkingLocation>(id)

        return JSON.parse(JSON.stringify(location))

    } catch (error) {
        console.log(error)
        throw error
    }
}

export async function getParkingLocations() {
    try {

        connectToDB()

        const location = await ParkingLocationModel.find<ParkingLocation>({})

        return JSON.parse(JSON.stringify(location))

    } catch (error) {
        console.log(error)
        throw error
    }
}


export async function sendConfirmationEmail(bookingid: string): Promise<ActionResponse> {
  try {
    const user = await currentUser()
    if (!user) {
      throw new Error("You must be logged in")
    }

    await connectToDB()

    const booking = await BookingModel.findById<Booking>(bookingid)
      .populate({ path: "locationid", model: ParkingLocationModel })
      .lean()

    if (!booking) {
      return {
        code: 1,
        message: "Booking not found",
      }
    }

    const html = await render(
      EmailTemplate({
        firstName: user.firstName!,
        bookingDate: formatDate(booking.bookingdate, "MMM dd, yyyy"),
        arrivingOn: formatDate(booking.starttime, "hh:mm a"),
        leavingOn: formatDate(booking.endtime, "hh:mm a"),
        plateNo: booking.plate,
        address: (booking.locationid as any).address,
      })
    )

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    })

    const info = await transporter.sendMail({
      from: `"Park Ease" <${process.env.GMAIL_USER}>`,
      to: user.primaryEmailAddress?.emailAddress!,
      subject: "Your booking has been confirmed",
      html,
    })

    return {
      code: 0,
      message: "Email sent",
      error: null,
    }
  } catch (error) {
    console.error("Email error:", error)
    return {
      code: 1,
      message: "Failed to send email",
      error,
    }
  }
}


export async function sendViolationEmail(
  plate: string,
  address: string,
  timestamp: string
): Promise<ActionResponse> {
  try {
    // Create a transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    })

    const html = await render(
      ViolationEmailTemplate({ plate, address, timestamp })
    )

    const info = await transporter.sendMail({
      from: `"Gateless Parking" <${process.env.GMAIL_USER}>`,
      to: process.env.VIOLATION_EMAIL!,
      subject: "Violation reported",
      html: html
    })

    return {
      code: 0,
      message: "Email sent",
      error: null
    }
  } catch (error) {
    console.error("Email error:", error)
    return {
      code: 1,
      message: "Failed to send email",
      error
    }
  }
}



export async function cancelBooking({ bookingid, path }: {
    bookingid: string, path: string
}) {

    try {
        await connectToDB()

        const booking = await BookingModel.findByIdAndUpdate(bookingid, {
            status: BookingStatus.CANCELLED,
            amount: 0
        })

        if (!booking) {
            return {
                code: 1,
                message: 'Booking not found'
            }
        }

        revalidatePath(path)
        return {
            code: 0,
            message: 'Booking cancelled'
        }
    } catch (error) {
        console.log(error)
        throw error
    }
}

export async function updateBooking(selfid: string, date: Date, starttime: string, endtime: string, path: string) {

    try {
        await connectToDB()

        const dt = format(date, 'yyyy-MM-dd')
        const st = new Date(`${dt}T${starttime}`)
        const et = new Date(`${dt}T${endtime}`)

        const originalBooking = await BookingModel.findById(selfid) as Booking

        if (!originalBooking) {
            throw new Error('Booking not found')
        }

        const parkingLocation =
            await ParkingLocationModel.findById(originalBooking.locationid).lean() as unknown as ParkingLocation

        const originalStarttime = originalBooking.starttime
        const originalEndtime = originalBooking.endtime
        let condition: any = {}

        // check for collisions with existing booking
        if (compareAsc(st, originalStarttime) !== 0 && compareAsc(et, originalEndtime) !== 0) {
            condition['starttime'] = { $lt: et }
            condition['endtime'] = { $gt: st }
        } else if (compareAsc(st, originalStarttime) !== 0) {
            condition['starttime'] = { $lte: st }
            condition['endtime'] = { $gt: st }
        } else if (compareAsc(et, originalEndtime) !== 0) {
            condition['starttime'] = { $lt: et }
            condition['endtime'] = { $gte: et }
        }

        const bookings = await BookingModel.find({
            _id: {
                $ne: selfid
            },
            locationid: originalBooking.locationid,
            status: BookingStatus.BOOKED,
            ...condition
        })

        if (bookings.length < parkingLocation.numberofspots) {
            originalBooking.bookingdate = date
            originalBooking.starttime = st
            originalBooking.endtime = et

            await originalBooking.save()
            revalidatePath(path)

            return {
                code: 0,
                message: 'booking updated'
            }
        }

        return {
            code: 1,
            message: 'Failed to update booking'
        }
    } catch (error) {
        console.log(error)
        throw error
    }
}

export async function getBookings(date: Date,
    locationid: string, status: BookingStatus) {

    try {

        const bookings = await BookingModel.find({
            status: status || BookingStatus.BOOKED,
            locationid: locationid,
            $expr: {
                $eq: [{
                    $dateToString: {
                        format: '%Y-%m-%d', date: '$bookingdate'
                    }
                }, format(date, 'yyyy-MM-dd')]
            }
        }).populate({
            path: 'locationid', model: ParkingLocationModel
        }).lean()

        return {
            code: 0,
            message: '',
            data: JSON.parse(JSON.stringify(bookings))
        }
    } catch (error) {
        throw error
    }

}

export async function deleteBooking(bookingid: string) {

    try {
        connectToDB()

        const booking = await BookingModel.findByIdAndDelete(bookingid)

    } catch (error) {
        throw error
    }
}