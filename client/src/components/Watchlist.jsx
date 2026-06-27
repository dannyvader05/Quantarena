import { useState, useEffect, useRef } from 'react'
import { Star, X, TrendingUp, TrendingDown } from 'lucide-react'
import api from '../services/api'
import StockSearch from './StockSearch'
import useLivePrice from '../hooks/useLivePrice'

const Watchlist = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [flashing, setFlashing] = useState({})
  const prevPrices = useRef({})

  const symbols = items.map((i) => i.symbol)
  const livePrices = useLivePrice(symbols)

  useEffect(() => {
    Object.entries(livePrices).forEach(([symbol, data]) => {
      const prev = prevPrices.current[symbol]
      if (prev !== undefined && prev !== data.price) {
        setFlashing((f) => ({ ...f, [symbol]: data.price > prev ? 'up' : 'down' }))
        setTimeout(() => {
          setFlashing((f) => ({ ...f, [symbol]: null }))
        }, 800)
      }
      prevPrices.current[symbol] = data.price
    })
  }, [livePrices])

  const fetchWatchlist = async () => {
    try {
      const res = await api.get('/watchlist')
      setItems(res.data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWatchlist()
  }, [])

  const handleAdd = async (stock) => {
    try {
      await api.post('/watchlist', { symbol: stock.symbol, companyName: stock.companyName })
      setAdding(false)
      fetchWatchlist()
    } catch (err) {
      console.error(err.response?.data?.message)
    }
  }

  const handleRemove = async (symbol) => {
    try {
      await api.delete(`/watchlist/${symbol}`)
      fetchWatchlist()
    } catch (err) {
      console.error(err.response?.data?.message)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Star size={18} className="text-amber-400" /> Watchlist
        </h2>
        <button
          onClick={() => setAdding(!adding)}
          className="text-green-400 text-sm hover:underline"
        >
          {adding ? 'Cancel' : '+ Add Stock'}
        </button>
      </div>

      {adding && (
        <div className="mb-4">
          <StockSearch onSelect={handleAdd} />
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">
          No stocks in your watchlist yet.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const live = livePrices[item.symbol]
            const price = live?.price ?? item.price
            const change = live?.change ?? item.change
            const changePercent = live?.changePercent ?? item.changePercent
            const flash = flashing[item.symbol]

            return (
              <div
                key={item.symbol}
                className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-white font-semibold text-sm">{item.symbol}</p>
                  <p className="text-gray-400 text-xs truncate max-w-40">{item.companyName}</p>
                </div>
                <div className="flex items-center gap-3">
                  {price !== null && price !== undefined ? (
                    <div className="text-right">
                      <p className={`text-white text-sm inline-block transition-colors duration-500 rounded px-1.5 ${
                        flash === 'up' ? 'bg-green-500/25' : flash === 'down' ? 'bg-red-500/25' : ''
                      }`}>
                        ${price.toFixed(2)}
                      </p>
                      <p className={`text-xs flex items-center gap-1 justify-end ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {changePercent?.toFixed(2)}%
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs">—</p>
                  )}
                  <button onClick={() => handleRemove(item.symbol)}>
                    <X size={16} className="text-gray-500 hover:text-red-400 transition" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Watchlist