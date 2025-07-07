import { LatLng, ParkingLocationStatus, Price } from '@/types';
import { Document, ObjectId, Schema, model, models } from 'mongoose';

export interface ParkingLocation extends Document {
  _id: ObjectId;
  address: string;
  gpscoords: LatLng;
  numberofspots: number;
  price: Price;
  status: string;
  bookedspots?: number;
  location: {
    type: string;
    coordinates: [number];
  };
  dynamicPricing?: boolean;
  locationCategory?: 'office' | 'mall' | 'cinema' | 'market' | 'university' | 'school' |null;
}

const ParkingLocationSchema = new Schema<ParkingLocation>(
  {
    address: String,
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number],
    },
    gpscoords: {
      lat: Number,
      lng: Number,
    },
    numberofspots: Number,
    price: {
      hourly: Number,
    },
    status: {
      type: String,
      default: ParkingLocationStatus.AVAILABLE,
    },
    dynamicPricing: {
      type: Boolean,
      default: false,
    },
    locationCategory: {
      type: String,
      enum: ['office', 'mall', 'cinema', 'market', 'university','school',null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const ParkingLocationModel =
  models.ParkingLocation || model('ParkingLocation', ParkingLocationSchema);

