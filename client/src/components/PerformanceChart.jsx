import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const RANGES = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'ALL', days: null },
]

const formatTick = (timestamp, rangeDays) => {
  const d = new Date(timestamp)
  if (rangeDays && rangeDays <= 1) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }
  if (rangeDays && rangeDays <= 90) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

const PerformanceChart = ({ data }) => {
  const [range, setRange] = useState('ALL')
  const selected = RANGES.find((r) => r.label === range)

  const filtered = useMemo(() => {
    if (!data || data.length === 0) return []
    if (!selected.days) return data
    const cutoff = Date.now() - selected.days * 24 * 60 * 60 * 1000
    const inRange = data.filter((d) => new Date(d.date).getTime() >= cutoff)
    return inRange.length >= 2 ? inRange : data.slice(-2)
  }, [data, range])

  const formatted = filtered.map((d) => ({
    time: new Date(d.date).getTime(),
    value: Math.round(d.value),
  }))

  // manually compute N evenly spaced tick positions across the actual domain
  const { domain, ticks } = useMemo(() => {
    if (formatted.length === 0) return { domain: ['auto', 'auto'], ticks: [] }
    const start = formatted[0].time
    const end = formatted[formatted.length - 1].time
    const NUM_TICKS = 6

    if (start === end) return { domain: [start, end], ticks: [start] }

    const step = (end - start) / (NUM_TICKS - 1)
    const computedTicks = Array.from({ length: NUM_TICKS }, (_, i) => Math.round(start + step * i))

    return { domain: [start, end], ticks: computedTicks }
  }, [formatted])

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">Portfolio Performance</h2>
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.label)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                range === r.label ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {formatted.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-20">No data for this range.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={formatted} margin={{ left: 0, right: 30, top: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
            <XAxis
              dataKey="time"
              type="number"
              domain={domain}
              ticks={ticks}
              interval={0}
              stroke="#8b949e"
              fontSize={11}
              tickFormatter={(t) => formatTick(t, selected.days)}
            />
            <YAxis stroke="#8b949e" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#161b22', border: '1px solid #21262d', borderRadius: 8 }}
              labelStyle={{ color: '#e6edf3' }}
              labelFormatter={(t) =>
                new Date(t).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })
              }
              formatter={(v) => [`$${v.toLocaleString()}`, 'Value']}
            />
            <Line type="monotone" dataKey="value" stroke="#3fb950" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default PerformanceChart