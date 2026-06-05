import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-green-400 mb-2">QuantArena</h1>
      <p className="text-gray-400 mb-6">Welcome back, {user?.username} 👋</p>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 text-center">
        <p className="text-gray-400 text-sm mb-1">Virtual Balance</p>
        <p className="text-3xl font-bold text-green-400">
          ${user?.virtualBalance?.toLocaleString()}
        </p>
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/trading')}
          className="bg-green-500 hover:bg-green-600 text-black font-bold px-6 py-2 rounded-lg transition"
        >
          Start Trading
        </button>
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default Dashboard