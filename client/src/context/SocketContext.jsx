import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [prices, setPrices] = useState({})
  const watchedSymbolsRef = useRef(new Set())

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect()
      return
    }

    const token = localStorage.getItem('accessToken')

    const socket = io('http://localhost:4000', {
      auth: { token },
    })

    socket.on('connect', () => {
      setConnected(true)
      if (watchedSymbolsRef.current.size > 0) {
        socket.emit('watch:symbols', Array.from(watchedSymbolsRef.current))
      }
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('price:update', (data) => {
      setPrices((prev) => ({
        ...prev,
        [data.symbol]: { price: data.price, change: data.change, changePercent: data.changePercent },
      }))
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [user])

  const watchSymbols = (symbols) => {
    const newSet = new Set(symbols.map((s) => s.toUpperCase()))
    watchedSymbolsRef.current = newSet
    socketRef.current?.emit('watch:symbols', Array.from(newSet))
  }

  return (
    <SocketContext.Provider value={{ connected, prices, watchSymbols }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)