import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import api from '../services/api'

const OrderForm = ({ stock, onSuccess }) => {
  const [quote, setQuote] = useState(null)
  const [shares, setShares] = useState('')
  const [type, setType] = useState('BUY')
  const [loading, setLoading] = useState(false)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (!stock) return
    const fetchQuote = async () => {
      setQuoteLoading(true)
      try {
        const res = await api.get(`/trading/quote/${stock.symbol}`)
        setQuote(res.data)
      } catch {
        setQuote(null)
      } finally {
        setQuoteLoading(false)
      }
    }
    fetchQuote()
    const interval = setInterval(fetchQuote, 30000)
    return () => clearInterval(interval)
  }, [stock])

  const totalCost = quote && shares ? (quote.price * parseFloat(shares)).toFixed(2) : '0.00'

  const handleSubmit = async () => {
    if (!shares || parseFloat(shares) <= 0) return
    setLoading(true)
    setMessage(null)
    try {
      const endpoint = type === 'BUY' ? '/trading/buy' : '/trading/sell'
      const res = await api.post(endpoint, {
        symbol: stock.symbol,
        shares: parseFloat(shares),
      })
      setMessage({ type: 'success', text: res.data.message })
      setShares('')
      if (onSuccess) onSuccess()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Order failed' })
    } finally {
      setLoading(false)
    }
  }

  if (!stock) return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center justify-center h-64">
      <p className="text-gray-500 text-sm">Search and select a stock to trade</p>
    </div>
  )

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-white font-bold text-xl">{stock.symbol}</h2>
          <p className="text-gray-400 text-sm">{stock.companyName}</p>
        </div>
        {quoteLoading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : quote ? (
          <div className="text-right">
            <p className="text-white font-bold text-2xl">${quote.price?.toFixed(2)}</p>
            <p className={`text-sm font-medium flex items-center justify-end gap-1 ${quote.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {quote.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {quote.change >= 0 ? '+' : ''}{quote.change?.toFixed(2)} ({quote.changePercent?.toFixed(2)}%)
            </p>
          </div>
        ) : null}
      </div>

      {/* Buy/Sell toggle */}
      <div className="flex bg-gray-800 rounded-xl p-1 mb-5">
        <button
          onClick={() => setType('BUY')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${type === 'BUY' ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'}`}
        >
          Buy
        </button>
        <button
          onClick={() => setType('SELL')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${type === 'SELL' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Sell
        </button>
      </div>

      {/* Shares input */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm mb-2 block">Number of shares</label>
        <input
          type="number"
          min="1"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          placeholder="0"
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition"
        />
      </div>

      {/* Order summary */}
      <div className="bg-gray-800 rounded-xl p-4 mb-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Price per share</span>
          <span className="text-white">${quote?.price?.toFixed(2) || '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Estimated total</span>
          <span className="text-white font-semibold">${totalCost}</span>
        </div>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm mb-4 ${message.type === 'success' ? 'bg-green-900/30 border border-green-700 text-green-400' : 'bg-red-900/30 border border-red-700 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !shares || !quote}
        className={`w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-50 ${type === 'BUY' ? 'bg-green-500 hover:bg-green-600 text-black' : 'bg-red-500 hover:bg-red-600 text-white'}`}
      >
        {loading ? 'Processing...' : `${type === 'BUY' ? 'Buy' : 'Sell'} ${stock.symbol}`}
      </button>
    </div>
  )
}

export default OrderForm