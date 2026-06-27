import { useEffect } from 'react'
import { useSocket } from '../context/SocketContext'

const useLivePrice = (symbols) => {
  const { prices, watchSymbols } = useSocket()

  useEffect(() => {
    if (symbols && symbols.length > 0) {
      watchSymbols(symbols)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(symbols)])

  return prices
}

export default useLivePrice