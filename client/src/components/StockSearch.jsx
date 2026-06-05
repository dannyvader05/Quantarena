import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import api from '../services/api'

const StockSearch = ({ onSelect }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true)
        const res = await api.get(`/trading/search?q=${query}`)
        setResults(res.data)
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }, [query])

  const handleSelect = (stock) => {
    onSelect(stock)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="flex items-center bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 gap-3 focus-within:border-green-500 transition">
        <Search size={18} className="text-gray-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stocks — AAPL, Tesla, Google..."
          className="bg-transparent text-white text-sm outline-none w-full placeholder-gray-500"
        />
        {query && (
          <button onClick={() => setQuery('')}>
            <X size={16} className="text-gray-400 hover:text-white" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {loading ? (
            <div className="px-4 py-3 text-gray-400 text-sm">Searching...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-gray-400 text-sm">No results found</div>
          ) : (
            results.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => handleSelect(stock)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800 transition text-left"
              >
                <div>
                  <p className="text-white font-semibold text-sm">{stock.symbol}</p>
                  <p className="text-gray-400 text-xs truncate max-w-xs">{stock.companyName}</p>
                </div>
                <span className="text-gray-500 text-xs">{stock.exchange}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default StockSearch