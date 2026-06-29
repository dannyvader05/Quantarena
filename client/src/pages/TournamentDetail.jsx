import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import StockSearch from '../components/StockSearch'
import AllocationChart from '../components/AllocationChart'
import TournamentTradeHistory from '../components/TournamentTradeHistory'
import { Trophy, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'

const TournamentDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [selectedStock, setSelectedStock] = useState(null)
  const [shares, setShares] = useState('')
  const [type, setType] = useState('BUY')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    try {
      const [tRes, lRes] = await Promise.all([
        api.get(`/tournaments/${id}`),
        api.get(`/tournaments/${id}/leaderboard`),
      ])
      setTournament(tRes.data)
      setLeaderboard(lRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [id])

  const handleTrade = async () => {
    if (!selectedStock || !shares) return
    try {
      const endpoint = type === 'BUY' ? 'buy' : 'sell'
      const res = await api.post(`/tournaments/${id}/${endpoint}`, {
        symbol: selectedStock.symbol, shares: parseFloat(shares),
      })
      setMessage({ type: 'success', text: res.data.message })
      setShares('')
      setSelectedStock(null)
      fetchAll()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Trade failed' })
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-500">Loading tournament...</p>
    </div>
  )

  if (!tournament) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-500">Tournament not found.</p>
    </div>
  )

  const myPortfolio = tournament.myPortfolio
  const holdings = myPortfolio?.holdings || []
  const totalValue = myPortfolio?.totalValue || tournament.startingCapital

  const allocation = [
    ...holdings.map((h) => ({
      symbol: h.symbol,
      value: h.currentValue,
      percent: (h.currentValue / totalValue) * 100,
    })),
    {
      symbol: 'CASH',
      value: myPortfolio?.cash || 0,
      percent: ((myPortfolio?.cash || 0) / totalValue) * 100,
    },
  ]

  const daysLeft = Math.max(0, Math.ceil((new Date(tournament.endDate) - Date.now()) / (1000 * 60 * 60 * 24)))

  // find current user's rank from the leaderboard by matching cash+holdings owner
  // (leaderboard entries are keyed by userId, and the logged-in user's entry
  // is whichever one belongs to them — found via isJoined + their own portfolio match)
  const myRankEntry = leaderboard.find((p) => p.totalValue === myPortfolio?.totalValue) || null
  const myRank = myRankEntry?.rank || '—'

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/tournaments')}>
            <ArrowLeft size={18} className="text-gray-400 hover:text-white transition" />
          </button>
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" /> {tournament.name}
            </h1>
            {tournament.description && (
              <p className="text-gray-500 text-xs">{tournament.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className={`px-2.5 py-1 rounded-full font-medium ${
            tournament.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' :
            tournament.status === 'UPCOMING' ? 'bg-amber-900/30 text-amber-400' :
            'bg-gray-800 text-gray-500'
          }`}>
            {tournament.status}
          </span>
          <span className="text-gray-500">{daysLeft} days left</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {!tournament.isJoined ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
            <Trophy size={32} className="text-amber-400 mx-auto mb-3" />
            <p className="text-gray-400">You haven't joined this tournament yet.</p>
          </div>
        ) : (
          <>
            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Portfolio Value</p>
                <p className="text-xl font-bold text-white">${myPortfolio?.totalValue?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Cash</p>
                <p className="text-xl font-bold text-green-400">${myPortfolio?.cash?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Total Return</p>
                {(() => {
                  const ret = (myPortfolio?.totalValue || tournament.startingCapital) - tournament.startingCapital
                  const retPct = (ret / tournament.startingCapital) * 100
                  return (
                    <p className={`text-xl font-bold ${ret >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {retPct >= 0 ? '+' : ''}{retPct.toFixed(2)}%
                    </p>
                  )
                })()}
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Positions</p>
                <p className="text-xl font-bold text-white">{holdings.length}</p>
              </div>
            </div>

            {/* Tournament Details + Your Standing — two cards side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-gray-500 text-xs mb-4 uppercase tracking-wide font-medium">Tournament Details</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Starting Capital</p>
                    <p className="text-white font-semibold text-base">${tournament.startingCapital.toLocaleString()}</p>
                  </div>
                  <div className="border-l border-gray-800 pl-6">
                    <p className="text-gray-500 text-xs mb-1">Started</p>
                    <p className="text-white font-semibold text-base">{new Date(tournament.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="border-l border-gray-800 pl-6">
                    <p className="text-gray-500 text-xs mb-1">Ends</p>
                    <p className="text-white font-semibold text-base">{new Date(tournament.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-gray-500 text-xs mb-4 uppercase tracking-wide font-medium">Your Standing</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Rank</p>
                    <p className="text-amber-400 font-bold text-lg">#{myRank}</p>
                  </div>
                  <div className="border-l border-gray-800 pl-6">
                    <p className="text-gray-500 text-xs mb-1">Participants</p>
                    <p className="text-white font-semibold text-base">{leaderboard.length}</p>
                  </div>
                  <div className="border-l border-gray-800 pl-6">
                    <p className="text-gray-500 text-xs mb-1">Time Left</p>
                    <p className="text-white font-semibold text-base">{daysLeft}d</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

              {/* Trade panel */}
              <div className="lg:col-span-1">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-white font-bold text-sm mb-4">Trade</h2>
                  <StockSearch onSelect={setSelectedStock} />

                  {selectedStock ? (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-gray-300 font-medium">{selectedStock.symbol}</p>
                      <div className="flex bg-gray-800 rounded-lg p-1">
                        <button onClick={() => setType('BUY')} className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${type === 'BUY' ? 'bg-green-500 text-black' : 'text-gray-400'}`}>Buy</button>
                        <button onClick={() => setType('SELL')} className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${type === 'SELL' ? 'bg-red-500 text-white' : 'text-gray-400'}`}>Sell</button>
                      </div>
                      <input
                        type="number" placeholder="Shares" value={shares}
                        onChange={(e) => setShares(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                      />
                      <button onClick={handleTrade} className={`w-full font-bold py-2 rounded-lg text-sm transition ${type === 'BUY' ? 'bg-green-500 hover:bg-green-600 text-black' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                        {type === 'BUY' ? 'Buy' : 'Sell'} {selectedStock.symbol}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center justify-center h-24 text-gray-600 text-xs">
                      Search a stock above to trade
                    </div>
                  )}

                  {message && (
                    <div className={`mt-3 text-xs rounded-lg px-3 py-2 ${message.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {message.text}
                    </div>
                  )}
                </div>
              </div>

              {/* Holdings table */}
              <div className="lg:col-span-1">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 h-full">
                  <h2 className="text-white font-bold text-lg mb-4">Your Holdings</h2>
                  {holdings.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-10">No positions yet. Trade to get started.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-800">
                            <th className="text-left pb-3 font-medium">Symbol</th>
                            <th className="text-right pb-3 font-medium">Shares</th>
                            <th className="text-right pb-3 font-medium">Value</th>
                            <th className="text-right pb-3 font-medium">P&L</th>
                          </tr>
                        </thead>
                        <tbody>
                          {holdings.map((h) => (
                            <tr key={h.symbol} className="border-b border-gray-800/50">
                              <td className="py-3">
                                <p className="text-white font-semibold">{h.symbol}</p>
                                <p className="text-gray-500 text-xs">${h.averageCost?.toFixed(2)} avg</p>
                              </td>
                              <td className="py-3 text-right text-white">{h.shares}</td>
                              <td className="py-3 text-right text-white">${h.currentValue?.toFixed(2)}</td>
                              <td className="py-3 text-right">
                                <div className={`flex items-center justify-end gap-1 ${h.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {h.unrealizedPnL >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                  ${h.unrealizedPnL?.toFixed(2)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Allocation */}
              <div className="lg:col-span-1">
                <AllocationChart allocation={allocation} />
              </div>
            </div>
          </>
        )}

        {/* Leaderboard — always visible regardless of join state */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">Leaderboard</h2>
          <div className="space-y-2">
            {leaderboard.map((p) => (
              <div key={p.userId} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                    p.rank === 1 ? 'bg-amber-400 text-black' :
                    p.rank === 2 ? 'bg-gray-300 text-black' :
                    p.rank === 3 ? 'bg-amber-700 text-white' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {p.rank}
                  </span>
                  <span className="text-white font-medium text-sm">{p.username}</span>
                  <span className="text-gray-500 text-xs">{p.holdingsCount} positions</span>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-medium">${p.totalValue.toFixed(2)}</p>
                  <p className={`text-xs ${p.totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {p.totalReturnPercent >= 0 ? '+' : ''}{p.totalReturnPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {tournament.isJoined && (
          <TournamentTradeHistory tournamentId={id} />
        )}
      </div>
    </div>
  )
}

export default TournamentDetail