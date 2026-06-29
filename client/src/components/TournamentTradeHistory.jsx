import { useEffect, useState } from 'react'
import api from '../services/api'

const TournamentTradeHistory = ({ tournamentId }) => {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/tournaments/${tournamentId}/trades`)
        setTrades(res.data.trades)
      } catch {
        setTrades([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [tournamentId])

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-white font-bold text-lg mb-4">Your Trade History</h2>
      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : trades.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No trades yet.</p>
      ) : (
        <div className="space-y-2">
          {trades.map((t) => (
            <div key={t._id} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${t.type === 'BUY' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {t.type}
                </span>
                <div>
                  <p className="text-white font-semibold text-sm">{t.symbol}</p>
                  <p className="text-gray-400 text-xs">{t.shares} shares @ ${t.price?.toFixed(2)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-sm font-medium">${t.total?.toFixed(2)}</p>
                {t.type === 'SELL' && (
                  <p className={`text-xs ${t.realizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    P&L: {t.realizedPnL >= 0 ? '+' : ''}${t.realizedPnL?.toFixed(2)}
                  </p>
                )}
                <p className="text-gray-500 text-xs">{new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TournamentTradeHistory