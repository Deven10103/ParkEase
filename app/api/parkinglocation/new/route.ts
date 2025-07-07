import { connectToDB } from "@/lib/db";
import { ParkingLocation, ParkingLocationModel } from "@/schemas/parking-locations";
import { NextRequest, NextResponse } from "next/server";

// 🧠 Stub function: Replace with real API later
async function getNearbyPlaceCategory(lat: number, lng: number): Promise<'office' | 'mall' | 'cinema' | 'market' | 'university' | 'school' | null> {
    const apiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY || process.env.NEXT_PUBLIC_MAPS_API_KEY_OLD;
    const radius = 1000; // meters
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${apiKey}`;
  
    try {
      const res = await fetch(url);
      const data = await res.json();
  
      if (!data.results || !Array.isArray(data.results)) return null;
  
      // Priority order based on typical usefulness
      for (const place of data.results) {
        const types: string[] = place.types;
  
        if (!types) continue;
  
        if (types.includes('shopping_mall')) return 'mall';
        if (types.includes('movie_theater')) return 'cinema';
        if (types.includes('department_store') || types.includes('supermarket') || types.includes('grocery_or_supermarket') || types.includes('convenience_store')) return 'market';
        if (types.includes('real_estate_agency') || types.includes('accounting') || types.includes('lawyer') || types.includes('insurance_agency') || types.includes('consulting') || types.includes('it')) return 'office';
        if(types.includes('university')) return 'university';
        if(types.includes('school')) return 'school';
      }
  
      return null;
    } catch (error) {
      console.error('Google Places API Error:', error);
      return null;
    }
}

export async function POST(request: NextRequest, response: NextResponse) {
    try {
        await connectToDB();

        const formData: FormData = await request.formData();
        const data = formData.get('data') as string;
        const parkingLocation = JSON.parse(data) as ParkingLocation;

        console.log(parkingLocation.address);

        // 🧠 Determine location category
        const category = await getNearbyPlaceCategory(
            parkingLocation.gpscoords.lat,
            parkingLocation.gpscoords.lng
        );

        const record = await ParkingLocationModel.create<ParkingLocation>({
            address: parkingLocation.address,
            gpscoords: parkingLocation.gpscoords,
            location: {
                coordinates: [
                    parkingLocation.gpscoords.lng,
                    parkingLocation.gpscoords.lat,
                ],
            },
            numberofspots: parkingLocation.numberofspots,
            price: parkingLocation.price,
            status: parkingLocation.status,
            dynamicPricing: true,
            locationCategory: category ?? null,
        });

        return NextResponse.json({
            message: "Parking location created",
            parkinglocation: record,
        });
    } catch (error) {
        console.error(error);
        return new NextResponse("Server error", { status: 500 });
    }
}
