const Stat = ({ label, value, positive, suffix = '' }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
    <p className="text-gray-400 text-xs mb-1">{label}</p>
    <p className={`text-xl font-bold ${positive === undefined ? 'text-white' : positive ? 'text-green-400' : 'text-red-400'}`}>
      {value}{suffix}
    </p>
  </div>
)

const AnalyticsStats = ({ analytics }) => {
  if (!analytics) return null
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Stat label="Sharpe Ratio" value={analytics.sharpeRatio?.toFixed(2)} positive={analytics.sharpeRatio >= 1} />
      <Stat label="Volatility" value={analytics.volatility?.toFixed(2)} suffix="%" />
      <Stat label="Max Drawdown" value={analytics.maxDrawdown?.toFixed(2)} suffix="%" positive={false} />
      <Stat label="Win Rate" value={analytics.winRate?.toFixed(1)} suffix="%" positive={analytics.winRate >= 50} />
    </div>
  )
}

export default AnalyticsStats