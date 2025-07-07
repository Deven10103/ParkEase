import { NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import { ParkingLocationModel } from "@/schemas/parking-locations"

export async function POST(req: NextRequest) {
  try {
    await connectToDB()
    const body = await req.json()

    const { id, field, value } = body

    if (!id || !field) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const update: Record<string, any> = {}
    update[field] = value

    await ParkingLocationModel.findByIdAndUpdate(id, update)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
