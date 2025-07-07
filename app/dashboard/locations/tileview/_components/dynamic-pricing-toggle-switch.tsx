'use client'

import { Switch } from "@/components/ui/switch"
import { useTransition, useState } from "react"

type Props = {
  id: string
  dynamicPricing: boolean
}

export default function DynamicPricingToggleSwitch({ id, dynamicPricing }: Props) {
  const [enabled, setEnabled] = useState(dynamicPricing)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    setEnabled(!enabled)
    startTransition(async () => {
      const res = await fetch(`/api/parkinglocation/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          field: 'dynamicPricing',
          value: !enabled
        })
      })

      if (!res.ok) {
        console.error('Failed to update dynamicPricing')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Switch checked={enabled} onCheckedChange={handleToggle} disabled={isPending} />
    </div>
  )
}
