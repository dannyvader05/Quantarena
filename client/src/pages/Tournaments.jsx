import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Trophy, Plus, Users, Clock, LayoutDashboard, TrendingUp, LogOut} from 'lucide-react'

const Tournaments = () => {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '' })
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const fetchTournaments = async () => {
    try {
      const res = await api.get('/tournaments')
      setTournaments(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTournaments() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/tournaments', form)
      setShowCreate(false)
      setForm({ name: '', description: '', startDate: '', endDate: '' })
      fetchTournaments()
    } catch (err) {
      console.error(err.response?.data?.message)
    }
  }

  const handleJoin = async (id) => {
    try {
      await api.post(`/tournaments/${id}/join`)
      navigate(`/tournaments/${id}`)
    } catch (err) {
      console.error(err.response?.data?.message)
    }
  }
   const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const statusColor = {
    UPCOMING: 'bg-amber-900/30 text-amber-400',
    ACTIVE: 'bg-green-900/30 text-green-400',
    ENDED: 'bg-gray-800 text-gray-500',
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950/80 backdrop-blur-sm z-10">
        <h1 className="text-green-400 font-bold text-xl">QuantArena</h1>
        <div className="flex items-center gap-1">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800 transition px-3 py-1.5 rounded-lg text-sm">
        <LayoutDashboard size={15} />
          Dashboard
        
        </button>
        <button onClick={() => navigate('/trading')}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black font-bold px-4 py-2 rounded-lg text-sm transition">
            <TrendingUp size={16} /> Trade
          </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 transition px-3 py-1.5 rounded-lg text-sm"
        >
          <LogOut size={15} />
          Logout
        </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="text-amber-400" size={24} /> Tournaments
          </h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black font-bold px-4 py-2 rounded-lg text-sm transition"
          >
            <Plus size={16} /> Create
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6 space-y-4">
            <input
              type="text" placeholder="Tournament name" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm"
            />
            <textarea
              placeholder="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Start Date</label>
                <input
                  type="datetime-local" required value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">End Date</label>
                <input
                  type="datetime-local" required value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm"
                />
              </div>
            </div>
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-black font-bold px-6 py-2 rounded-lg text-sm transition">
              Create Tournament
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : tournaments.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No tournaments yet. Create one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournaments.map((t) => (
              <div key={t._id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-white">{t.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[t.status]}`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4">{t.description || 'No description'}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><Users size={12} /> {t.participantCount}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> Ends {new Date(t.endDate).toLocaleDateString()}</span>
                  <span>${t.startingCapital.toLocaleString()} starting</span>
                </div>
                {t.isJoined ? (
                  <button onClick={() => navigate(`/tournaments/${t._id}`)} className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2 rounded-lg transition">
                    View
                  </button>
                ) : (
                  <button onClick={() => handleJoin(t._id)} disabled={t.status === 'ENDED'} className="w-full bg-green-500 hover:bg-green-600 text-black text-sm font-bold py-2 rounded-lg transition disabled:opacity-40">
                    Join Tournament
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Tournaments