import { connectToDB } from '@/lib/db';
import { ParkingLocation, ParkingLocationModel } from '@/schemas/parking-locations';
import { BookingModel } from '@/schemas/booking';
import React from 'react';
import LocationCard from './_components/location-card';
import { getStreetFromAddress } from '@/lib/utils';

async function LocationsTileViewPage() {
  await connectToDB();

  // Fetch all parking locations
  const locations: ParkingLocation[] = (await ParkingLocationModel.find({})) as [ParkingLocation];

  // Fetch bookings grouped by location and count only active bookings
  const bookingsByLocation = await BookingModel.aggregate([
    { $match: { status: 'BOOKED' } },
    {
      $group: {
        _id: '$locationid',
        bookedCount: { $sum: 1 },
      },
    },
  ]);

  // Create a map of locationId to bookedCount for quick access
  const bookingsMap = new Map(bookingsByLocation.map((item) => [item._id.toString(), item.bookedCount]));

  // Render the locations with updated booked and available spots
  return (
    <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-2 p-4">
      {locations.map((location) => {
        const bookedSpots = bookingsMap.get(location._id.toString()) || 0;
        const availableSpots = location.numberofspots - bookedSpots;
  
        return (
          <LocationCard
            key={location._id.toString()} // Use _id as the key, ensure it's a string
            id={location._id.toString()}
            name={getStreetFromAddress(location.address)}
            address={location.address}
            numberOfSpots={location.numberofspots}
            spotsAvailable={availableSpots}
            spotsBooked={bookedSpots}
            status={location.status}
            price={location.price}
          />
        );
      })}
    </div>
  );
  
}

export default LocationsTileViewPage;

