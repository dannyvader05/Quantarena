import { useSocket } from '../context/SocketContext'
import { Wifi, WifiOff } from 'lucide-react'

const ConnectionStatus = () => {
  const { connected } = useSocket()

  return (
    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
      connected ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-500'
    }`}>
      {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
      {connected ? 'Live' : 'Connecting...'}
    </div>
  )
}

export default ConnectionStatus