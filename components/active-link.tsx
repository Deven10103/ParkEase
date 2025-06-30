'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

type Props = {
    children: React.ReactNode,
    href: string
}
function ActiveLink({children, href}: Props) {

    const pathname = usePathname()
    const isActive = pathname ===  href ? 'bg-black': ''
  return (
    <Link href={href} className={`${isActive}`}>
        <div className={cn("px-4 py-2 rounded-md hover:bg-black", isActive)}>{children}</div>
    </Link>
  )
}

export default ActiveLink