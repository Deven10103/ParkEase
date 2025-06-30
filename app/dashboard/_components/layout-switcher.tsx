import { ListIcon, MapIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

function LayoutSwitcher() {
  return (
    <div className="flex justify-end space-x-2 p-2">
      <Link href="/dashboard/locations/tileview" className="bg-white p-1 rounded">
        <ListIcon className="text-black" />
      </Link>
      <Link href="/dashboard/locations/mapview" className="bg-white p-1 rounded">
        <MapIcon className="text-black" />
      </Link>
    </div>
  )
}

export default LayoutSwitcher
