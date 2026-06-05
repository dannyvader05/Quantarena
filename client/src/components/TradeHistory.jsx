import { useEffect, useState } from 'react'
import api from '../services/api'

const TradeHistory = () => {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/trading/history')
        setTrades(res.data.trades)
      } catch {
        setTrades([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-white font-bold text-lg mb-4">Trade History</h2>
      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : trades.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No trades yet.</p>
      ) : (
        <div className="space-y-3">
          {trades.map((trade) => (
            <div key={trade._id} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trade.type === 'BUY' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {trade.type}
                </span>
                <div>
                  <p className="text-white font-semibold text-sm">{trade.symbol}</p>
                  <p className="text-gray-400 text-xs">{trade.shares} shares @ ${trade.price?.toFixed(2)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-sm font-medium">${trade.total?.toFixed(2)}</p>
                {trade.type === 'SELL' && (
                  <p className={`text-xs ${trade.realizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    P&L: {trade.realizedPnL >= 0 ? '+' : ''}${trade.realizedPnL?.toFixed(2)}
                  </p>
                )}
                <p className="text-gray-500 text-xs">
                  {new Date(trade.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TradeHistory