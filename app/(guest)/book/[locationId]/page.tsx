'use client'

import { getParkingLocation } from '@/actions/actions'
import { createCheckoutSession } from '@/actions/stripe'
import { getDynamicPrice } from '@/actions/dynamicPrice'  // <-- import this
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { formatAmountForDisplay, getStreetFromAddress } from '@/lib/utils'
import { ParkingLocation } from '@/schemas/parking-locations'
import { zodResolver } from '@hookform/resolvers/zod'
import { differenceInMinutes, format } from 'date-fns'
import { ArrowRight, Loader } from 'lucide-react'
import { useParams, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const FormSchema = z.object({
  plateno: z.string().min(1, {
    message: 'Plate number must be at least 1 character.'
  })
})

function BookPage() {
  const [loading, setLoading] = useState(false)
  const params = useParams<{ locationId: string }>()
  const locationId = params.locationId
  const searchParams = useSearchParams()
  const date = searchParams.get('date')
  const startTimeStr = searchParams.get('starttime')
  const endTimeStr = searchParams.get('endtime')
  const [location, setLocation] = useState<ParkingLocation>()
  const [dynamicPrice, setDynamicPrice] = useState<number | null>(null)
  const [surgeAmount, setSurgeAmount] = useState<number>(0)

  // Parse date strings into Date objects
  const startTime = startTimeStr ? new Date(`${date}T${startTimeStr}`) : null
  const endTime = endTimeStr ? new Date(`${date}T${endTimeStr}`) : null

  // Calculate difference in hours between start and end
  const diffInHours = useMemo(() =>
    (startTime && endTime) ? differenceInMinutes(endTime, startTime) / 60 : 0
    , [startTime, endTime])

  useEffect(() => {
    ;(async () => {
      if (!locationId) return
      const loc = await getParkingLocation(locationId)
      setLocation(loc as ParkingLocation)
    })()
  }, [locationId])

  useEffect(() => {
    ;(async () => {
      if (!locationId || !date || !startTimeStr || !endTimeStr) {
        setDynamicPrice(null)
        setSurgeAmount(0)
        return
      }
  
      try {
        const { price, surgeAmount } = await getDynamicPrice(
          locationId,
          date,
          startTimeStr,
          endTimeStr
        )
        setDynamicPrice(price)
        setSurgeAmount(surgeAmount)
      } catch (err) {
        console.error(err)
        setDynamicPrice(null)
        setSurgeAmount(0)
      }
    })()
  }, [locationId, date, startTimeStr, endTimeStr])

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      plateno: ''
    }
  })

  async function onSubmit(formData: z.infer<typeof FormSchema>) {
    if (!location || !date || !startTimeStr || !endTimeStr || dynamicPrice === null) return

    setLoading(true)

    try {
      const fd = new FormData()
      fd.append('address', getStreetFromAddress(location.address))
      fd.append('amount', `${dynamicPrice}`)  // pass dynamic price here
      fd.append('locationid', `${location._id}`)
      fd.append('bookingdate', date)
      fd.append('starttime', startTimeStr)
      fd.append('endtime', endTimeStr)
      fd.append('plate', formData.plateno)

      await createCheckoutSession(fd)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col min-h-screen'>
      <main className="flex-grow sm:-mt-16 sm:container flex flex-col items-center">

        <div className="grid grid-cols-3 w-[400px] sm:w-[700px] p-4 bg-slate-300">

          <div className="space-y-1 sm:justify-self-center">
            <h4 className="flex items-center text-gray-500"><ArrowRight className='mr-2 h-4 w-4' />Entrance</h4>
            <p className="text-sm font-bold">{startTime ? format(startTime, 'MMM, dd yyyy HH:mm a') : '...'}</p>
          </div>

          <div className="h-10 self-center justify-self-center">
            <Separator className='bg-gray-400' orientation='vertical' />
          </div>

          <div className="space-y-1 sm:justify-self-center">
            <h4 className="flex items-center text-gray-500">Exit<ArrowRight className='ml-2 h-4 w-4' /></h4>
            <p className="text-sm font-bold">{endTime ? format(endTime, 'MMM, dd yyyy HH:mm a') : '...'}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='bg-white w-[400px] sm:w-[700px] border p-4 shadow flex flex-col pt-12 pb-12 space-y-4' >
            <div>
              {location && <p className='font-bold text-xl'>{getStreetFromAddress(location.address)}</p>}
            </div>

            <div className="flex flex-col bg-slate-100 p-4 gap-y-2 rounded">
              <div className="flex justify-between text-sm font-bold">
                <p>Base Hourly rate</p>
                <p>{location ? formatAmountForDisplay(location.price.hourly, 'INR') : '...'}</p>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <p>{diffInHours} Hours</p>
                <p>{location ? formatAmountForDisplay(diffInHours * location.price.hourly, 'INR') : '...'}</p>
              </div>

              {/* Show surge charge if any */}
              <div className="flex justify-between text-sm font-bold text-red-600">
                <p>Surge / High Demand Charge</p>
                <p>{location && dynamicPrice !== null ? formatAmountForDisplay(dynamicPrice - diffInHours * location.price.hourly, 'INR') : '₹0.00'}</p>
              </div>

              {/* Show total amount */}
              <div className="flex justify-between text-sm font-bold text-green-700">
                <p>Total Amount</p>
                <p>{dynamicPrice !== null ? formatAmountForDisplay(dynamicPrice, 'INR') : '...'}</p>
              </div>
            </div>

            <FormField
              control={form.control}
              name='plateno'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Plate #
                  </FormLabel>
                  <FormControl>
                    <Input className='uppercase' placeholder='ABCD 1234' {...field} />
                  </FormControl>
                  <FormDescription>
                    Make sure your license plate matches the vehicle you park to avoid a parking ticket or towing.
                  </FormDescription>
                </FormItem>
              )}
            />

            {
              loading ? <Loader /> :
                <Button className="bg-black text-white hover:bg-gray-800">Proceed to payment</Button>
            }
          </form>
        </Form>
      </main>
      <section className='w-full'>
        <Footer />
      </section>
    </div>
  )
}

export default BookPage

