import { TrendingUp, TrendingDown } from 'lucide-react'

const Holdings = ({ holdings }) => {
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
            {holdings.map((h) => (
              <tr key={h.symbol} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                <td className="py-4">
                  <p className="text-white font-semibold">{h.symbol}</p>
                  <p className="text-gray-500 text-xs truncate max-w-32">{h.companyName}</p>
                </td>
                <td className="py-4 text-right text-white">{h.shares}</td>
                <td className="py-4 text-right text-gray-300">${h.averageCost?.toFixed(2)}</td>
                <td className="py-4 text-right">
                  <p className="text-white">${h.currentPrice?.toFixed(2) || '—'}</p>
                  {h.changePercent !== undefined && (
                    <p className={`text-xs ${h.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {h.changePercent >= 0 ? '+' : ''}{h.changePercent?.toFixed(2)}%
                    </p>
                  )}
                </td>
                <td className="py-4 text-right text-white">${h.currentValue?.toFixed(2)}</td>
                <td className="py-4 text-right">
                  <div className={`flex items-center justify-end gap-1 ${h.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {h.unrealizedPnL >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <div>
                      <p className="font-medium">${h.unrealizedPnL?.toFixed(2)}</p>
                      <p className="text-xs">{h.unrealizedPnLPercent?.toFixed(2)}%</p>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Holdings