import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import api from '../services/api'

const StockInsight = ({ symbol, companyName }) => {
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchInsight = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/ai/insight?symbol=${symbol}&companyName=${encodeURIComponent(companyName)}`)
      setInsight(res.data.insight)
    } catch {
      setError('Could not load insight right now.')
    } finally {
      setLoading(false)
    }
  }

  if (!symbol) return null

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-purple-400 flex items-center gap-1.5">
          <Sparkles size={13} /> AI Insight
        </p>
        {!insight && !loading && (
          <button onClick={fetchInsight} className="text-xs text-green-400 hover:underline">
            Generate
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500 text-xs">
          <Loader2 size={12} className="animate-spin" /> Thinking...
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {insight && (
        <p className="text-gray-300 text-xs leading-relaxed">{insight}</p>
      )}
    </div>
  )
}

export default StockInsight