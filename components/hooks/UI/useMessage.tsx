import { useEffect, useState } from 'react'

const useMessage = () => {
  const id = 'message__bar'
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (message) {
      const el = document.getElementById(id)
      if (el) {
        el.innerText = message
        el.classList.replace('translate-y-[calc(100%+20px)]', 'translate-y-0')
        setTimeout(() => {
          el.classList.replace('translate-y-0', 'translate-y-[calc(100%+20px)]')
          setTimeout(() => setMessage(''), 1000)
        }, 3000)
      }
    }
  }, [message])

  return {
    message,
    setMessage,
    MessageBar: () => (
      <div
        id={id}
        className="translate-y-[calc(100%+20px)] transition fixed z-[999999999] w-[auto] left-[50%] translate-x-[-50%] bottom-[20px] bg-black rounded-lg flex justify-center items-center text-center text-white p-4"
      />
    ),
  }
}

export default useMessage
