import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const Logo = () => {
  return (
    <Link href="/" className="flex items-center">
      <div className="w-10 h-10 flex items-center justify-center">
        <Image
          src="/roi dog logo.jpg"
          alt="roas.dog logo"
          width={40}
          height={40}
          className="w-full h-full object-contain rounded-lg"
        />
      </div>
      <span className="ml-2 font-bold text-lg text-black">roas.dog</span>
    </Link>
  )
}

export default Logo
