import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const usePortfolio = () => {
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/trading/portfolio')
      setPortfolio(res.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch portfolio')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  return { portfolio, loading, error, refetch: fetchPortfolio }
}

export default usePortfolio