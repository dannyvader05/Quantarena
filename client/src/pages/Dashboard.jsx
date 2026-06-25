import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import PerformanceChart from '../components/PerformanceChart'
import AllocationChart from '../components/AllocationChart'
import AnalyticsStats from '../components/AnalyticsStats'
import Watchlist from '../components/Watchlist'
import { LogOut, TrendingUp } from 'lucide-react'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/analytics/summary')
        setAnalytics(res.data)
      } catch {
        setAnalytics(null)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-green-400 font-bold text-xl">QuantArena</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/trading')}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black font-bold px-4 py-2 rounded-lg text-sm transition">
            <TrendingUp size={16} /> Trade
          </button>
          <button onClick={logout} className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition text-sm">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-gray-400 mb-6">Welcome back, {user?.username} 👋</p>

        {loading ? (
          <p className="text-gray-500">Loading analytics...</p>
        ) : !analytics ? (
          <p className="text-gray-500">No trading activity yet. Start trading to see analytics.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Portfolio Value</p>
                <p className="text-xl font-bold text-white">${analytics.totalValue?.toFixed(2)}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Total Return</p>
                <p className={`text-xl font-bold ${analytics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {analytics.totalReturnPercent?.toFixed(2)}%
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Realized P&L</p>
                <p className={`text-xl font-bold ${analytics.totalRealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${analytics.totalRealizedPnL?.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Total Trades</p>
                <p className="text-xl font-bold text-white">{analytics.totalTrades}</p>
              </div>
            </div>

            <AnalyticsStats analytics={analytics} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PerformanceChart data={analytics.performanceHistory} />
              </div>
              <div>
                <AllocationChart allocation={analytics.allocation} />
              </div>
            </div>
            <Watchlist />
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard