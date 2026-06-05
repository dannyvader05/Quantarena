import { useState } from 'react'
import StockSearch from '../components/StockSearch'
import OrderForm from '../components/OrderForm'
import Holdings from '../components/Holdings'
import TradeHistory from '../components/TradeHistory'
import usePortfolio from '../hooks/usePortfolio'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut } from 'lucide-react'

const Trading = () => {
  const [selectedStock, setSelectedStock] = useState(null)
  const { portfolio, loading, refetch } = usePortfolio()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-green-400 font-bold text-xl">QuantArena</h1>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-gray-400 text-xs">Portfolio Value</p>
            <p className="text-white font-bold">
              ${portfolio?.totalValue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">Cash</p>
            <p className="text-green-400 font-bold">
              ${portfolio?.cash?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition text-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Stats bar */}
        {portfolio && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">Total Return</p>
              <p className={`text-xl font-bold ${portfolio.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolio.totalReturn >= 0 ? '+' : ''}${portfolio.totalReturn?.toFixed(2)}
              </p>
              <p className={`text-xs ${portfolio.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolio.totalReturnPercent >= 0 ? '+' : ''}{portfolio.totalReturnPercent?.toFixed(2)}%
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">Invested</p>
              <p className="text-white text-xl font-bold">${portfolio.investedValue?.toFixed(2)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">Cash Balance</p>
              <p className="text-white text-xl font-bold">${portfolio.cash?.toFixed(2)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">Positions</p>
              <p className="text-white text-xl font-bold">{portfolio.holdings?.length || 0}</p>
            </div>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Left — search + order form */}
          <div className="lg:col-span-1 space-y-4">
            <StockSearch onSelect={setSelectedStock} />
            <OrderForm
              stock={selectedStock}
              onSuccess={() => {
                refetch()
                setSelectedStock(null)
              }}
            />
          </div>

          {/* Right — holdings */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-gray-500 text-sm">Loading portfolio...</p>
              </div>
            ) : (
              <Holdings holdings={portfolio?.holdings} />
            )}
          </div>
        </div>

        {/* Trade history */}
        <TradeHistory />
      </div>
    </div>
  )
}

export default Trading