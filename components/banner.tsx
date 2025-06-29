import Link from 'next/link'
import React from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MenuIcon } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

function Banners() {
    return (
        <div className="w-full mx-auto bg-black text-white">
            <div className="flex items-center justify-between px-8 py-4">
                <header>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
                        <Link href='/'>Park Ease</Link>
                    </h1>
                </header>
                <div>
                    <div className="sm:hidden flex space-x-2 items-baseline">
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <MenuIcon />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>
                                    Signout
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Link href='/mybookings'>My bookings</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Link href='/dashboard'>Admin</Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="hidden sm:flex gap-x-4 items-center">
                        <Link href='/mybookings'>My bookings</Link>
                        <Link href='/dashboard'>Admin</Link>
                        <SignedOut>
                            <SignInButton />
                        </SignedOut>
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </div>
                </div>
            </div>
            <div className="bg-black w-full h-20"></div>
        </div>
    );
}


export default Banners