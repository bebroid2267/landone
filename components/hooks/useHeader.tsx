import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const hiddenRoutes = ['/editor/', '/preview/', '/oauth']
const notHiddenRoutes = ['/guides/']

const useHeader = () => {
  const [isVisible, setVisible] = useState<boolean | undefined>(undefined)
  const pathname = usePathname()
  useEffect(() => {
    if (
      hiddenRoutes.some((route) => pathname.includes(route)) &&
      !notHiddenRoutes.some((route) => pathname.includes(route))
    ) {
      setVisible(false)
    } else {
      setVisible(true)
    }
  }, [pathname])

  return isVisible
}

export default useHeader
