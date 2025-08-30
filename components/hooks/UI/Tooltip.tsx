import {
  useState,
  useEffect,
  createContext,
  useContext,
  MouseEvent,
  PropsWithChildren,
  SetStateAction,
  Dispatch,
} from 'react'

const TooltipContext = createContext<{
  visibleTooltips: Record<string, boolean>
  toggleVisible: (id: string) => void
  setVisibleTooltips: Dispatch<SetStateAction<Record<string, boolean>>>
} | null>(null)

const TooltipProvider = ({ children }: PropsWithChildren) => {
  const [visibleTooltips, setVisibleTooltips] = useState<
    Record<string, boolean>
  >({})

  const toggleVisible = (id: string) => {
    setVisibleTooltips((prev) => {
      Object.keys(prev).forEach((key) => {
        prev[key] = key === id ? !prev[id] : false
      })
      return { ...prev }
    })
  }

  return (
    <TooltipContext.Provider
      value={{ visibleTooltips, setVisibleTooltips, toggleVisible }}
    >
      {children}
    </TooltipContext.Provider>
  )
}

const useTooltip = () => {
  const context = useContext(TooltipContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

const Tooltip = ({
  id,
  className = '',
  children,
}: { id: string; className?: string } & PropsWithChildren) => {
  const { visibleTooltips, setVisibleTooltips, toggleVisible } = useTooltip()

  useEffect(() => {
    setVisibleTooltips((prev) => ({ ...prev, [id]: false }))
  }, [id])

  return (
    <div
      id={id}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
          toggleVisible(id)
        }
      }}
      className={`${
        visibleTooltips[id] ? 'block' : 'hidden'
      } absolute z-[9999999] ${className}`}
    >
      {children}
    </div>
  )
}

export { TooltipProvider, Tooltip, useTooltip }
