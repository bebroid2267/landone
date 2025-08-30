import { useRef, ReactNode } from 'react'

interface ContextMenuProps {
  children: ReactNode
  isOpen: boolean
  toggleContext: (state: boolean) => void | undefined
  position: {
    x: number
    y: number
    width: number
  }
}

const ContextMenu = ({
  children,
  isOpen,
  toggleContext,
  position,
}: ContextMenuProps) => {
  const contextMenuRef = useRef<HTMLDivElement | null>(null)
  if (!isOpen) {
    return null
  }

  const isLastInRow = position.width - position.x < 149

  return (
    <>
      <div className="fixed inset-0" onClick={() => toggleContext(false)}></div>
      <div
        className="absolute bg-[#FFFFFF] mt-[20px] ml-[-10px] border border-gray-700 shadow-xl 
                z-500 rounded opacity-100 transition-opacity flex flex-col gap-[10px] w-[149px] p-[12px]"
        style={{
          top: `${position.y}px`,
          left: `${
            isLastInRow
              ? position.x - (149 - (position.width - position.x)) - 40
              : position.x
          }px`,
        }}
        ref={contextMenuRef}
      >
        {children}
      </div>
    </>
  )
}

export default ContextMenu
