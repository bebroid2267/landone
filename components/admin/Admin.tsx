'use client'

import { useState } from 'react'

export default function Admin() {
  const [isFetching, setFetching] = useState(false)
  const fetchAdmin = () => {
    setFetching(true)
    fetch('/api/admin', { method: 'POST' })
      .then((res) =>
        res
          .text()
          .then((data) => {
            console.log(JSON.parse(data))
            setFetching(false)
          })
          .catch((error) => {
            console.error(error)
            setFetching(false)
          }),
      )
      .catch((error) => {
        console.error(error)
        setFetching(false)
      })
  }
  return (
    <div className="fixed top-1 left-[50%] translate-x-[-50%] z-[9999999] w-full flex justify-center mt-5">
      <button
        className="p-4 bg-black hover:bg-opacity-80 text-white rounded-lg"
        onClick={fetchAdmin}
        disabled={isFetching}
      >
        {isFetching ? 'FETCHING...' : 'FETCH ADMIN'}
      </button>
    </div>
  )
}
