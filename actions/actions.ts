'use server'

import { SearchParams } from "@/components/search-component"
import { connectToDB } from "@/lib/db"
import { BookingModel } from "@/schemas/booking"
import { ParkingLocation, ParkingLocationModel } from "@/schemas/parking-locations"
import { BookingStatus, ParkingLocationStatus, UpdateLocationParams } from "@/types"
import { revalidatePath } from "next/cache"


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
    } catch(error) {
        console.log(error)
        throw error
    }

}

export async function findNearbyLocations(maxDistance: number, searchParams: SearchParams) {

    try {

        await connectToDB()

        const st = new Date(`${searchParams.arrivingon}T${searchParams.arrivingtime}`)
        const et = new Date(`${searchParams.arrivingon}T${searchParams.leavingtime}`)

        const parkingLocations = await ParkingLocationModel.find({
            location: {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [searchParams.gpscoords.lng, searchParams.gpscoords.lat]
                    },
                    $maxDistance: maxDistance // meters
                }
            }
        }).lean<ParkingLocation[]>();

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