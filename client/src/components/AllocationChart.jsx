import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#3fb950', '#58a6ff', '#d29922', '#f78166', '#a371f7', '#39c5cf', '#f47174']

const AllocationChart = ({ allocation }) => {
  const data = (allocation || [])
    .filter((a) => a.value > 0)
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-bold text-lg mb-4">Allocation</h2>
        <p className="text-gray-500 text-sm text-center py-10">No data yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-white font-bold text-lg mb-4">Allocation</h2>

      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="symbol"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#161b22', border: '1px solid #21262d', borderRadius: 8 }}
              labelStyle={{ color: '#e6edf3' }}
              formatter={(value, name) => [`$${value.toFixed(2)}`, name]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend list */}
        <div className="w-full space-y-2 mt-2">
          {data.map((item, i) => (
            <div key={item.symbol} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-gray-300">{item.symbol}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-xs">${item.value.toFixed(2)}</span>
                <span className="text-white font-medium w-12 text-right">
                  {item.percent.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AllocationChart