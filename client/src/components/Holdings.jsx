import { useState, useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import useLivePrice from '../hooks/useLivePrice'

const Holdings = ({ holdings }) => {
  const symbols = (holdings || []).map((h) => h.symbol)
  const livePrices = useLivePrice(symbols)
  const [flashing, setFlashing] = useState({})
  const prevPrices = useRef({})

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

  if (!holdings || holdings.length === 0) return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-white font-bold text-lg mb-4">Holdings</h2>
      <p className="text-gray-500 text-sm text-center py-8">No positions yet. Buy your first stock above.</p>
    </div>
  )

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-white font-bold text-lg mb-4">Holdings</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left pb-3 font-medium">Symbol</th>
              <th className="text-right pb-3 font-medium">Shares</th>
              <th className="text-right pb-3 font-medium">Avg Cost</th>
              <th className="text-right pb-3 font-medium">Current</th>
              <th className="text-right pb-3 font-medium">Value</th>
              <th className="text-right pb-3 font-medium">P&L</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const live = livePrices[h.symbol]
              const currentPrice = live?.price ?? h.currentPrice
              const changePercent = live?.changePercent ?? h.changePercent
              const currentValue = currentPrice * h.shares
              const unrealizedPnL = (currentPrice - h.averageCost) * h.shares
              const unrealizedPnLPercent = ((currentPrice - h.averageCost) / h.averageCost) * 100
              const flash = flashing[h.symbol]

              return (
                <tr key={h.symbol} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="py-4">
                    <p className="text-white font-semibold">{h.symbol}</p>
                    <p className="text-gray-500 text-xs truncate max-w-32">{h.companyName}</p>
                  </td>
                  <td className="py-4 text-right text-white">{h.shares}</td>
                  <td className="py-4 text-right text-gray-300">${h.averageCost?.toFixed(2)}</td>
                  <td className="py-4 text-right">
                    <p className={`text-white inline-block transition-colors duration-500 rounded px-1.5 ${
                      flash === 'up' ? 'bg-green-500/25' : flash === 'down' ? 'bg-red-500/25' : ''
                    }`}>
                      ${currentPrice?.toFixed(2) || '—'}
                    </p>
                    {changePercent !== undefined && (
                      <p className={`text-xs ${changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {changePercent >= 0 ? '+' : ''}{changePercent?.toFixed(2)}%
                      </p>
                    )}
                  </td>
                  <td className="py-4 text-right text-white">${currentValue?.toFixed(2)}</td>
                  <td className="py-4 text-right">
                    <div className={`flex items-center justify-end gap-1 ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {unrealizedPnL >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <div>
                        <p className="font-medium">${unrealizedPnL?.toFixed(2)}</p>
                        <p className="text-xs">{unrealizedPnLPercent?.toFixed(2)}%</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Holdings