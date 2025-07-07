import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import LocationToggleSwitch from "./location-enable-switch"
import { formatAmountForDisplay } from "@/lib/utils"
import LocationDeleteButton from "./location-delete-button"
import Link from "next/link"
import { PencilIcon } from "lucide-react"
import DynamicPricingToggleSwitch from "./dynamic-pricing-toggle-switch"

type Props = {
  id: string,
  name: string,
  address: string,
  numberOfSpots: number,
  status: string,
  price: {
    hourly: number
  }
  dynamicPricing: boolean
}

const LocationCard: React.FC<Props> = ({
  id, name, address, numberOfSpots, status, price, dynamicPricing
}) => {
  return (
    <Card className="w-full lg:w-[350px] shadow-xl rounded-2xl border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{name}</CardTitle>
        <CardDescription className="text-sm text-gray-500 mt-1">{address}</CardDescription>

        {/* Toggle section */}
        <hr />
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">Available</div>
            <LocationToggleSwitch props={JSON.stringify({ id, name, status })} />
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">Dynamic Pricing</div>
            <DynamicPricingToggleSwitch id={id} dynamicPricing={dynamicPricing} />
          </div>
        </div>
      </CardHeader>
      <hr />

      <CardContent>
        <div className="space-y-2">
          <p className="text-sm">💰 <span className="font-medium">Hourly price:</span> {formatAmountForDisplay(price.hourly, 'INR')}</p>
          <p className="text-sm">🚗 <span className="font-medium">Spots available:</span> {numberOfSpots}</p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <LocationDeleteButton props={JSON.stringify({ id })} />
        <Link href={`./edit/${id}`}>
          <PencilIcon className="hover:scale-105 hover:text-blue-500 transition-transform" />
        </Link>
      </CardFooter>
    </Card>
  )
}

export default LocationCard
