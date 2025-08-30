import { PropsWithChildren } from 'react'
import DashboardLayout from './DashboardLayout'

const Main = ({ children }: PropsWithChildren) => {
  return <DashboardLayout>{children}</DashboardLayout>
}

export default Main
