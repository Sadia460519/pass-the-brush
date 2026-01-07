'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Palette, Users, Clock, Plus, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Chain {
  id: string
  title: string
  max_players: number
  current_player_index: number
  status: 'waiting' | 'active' | 'completed' | 'cancelled'
  creator_id: string
  created_at: string
  chain_players: Array<{ user_id: string }>
}

export default function ChainsPage() {
  const [chains, setChains] = useState<Chain[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'waiting' | 'active' | 'completed'>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchChains()
  }, [filter])

  const fetchChains = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('chains')
        .select(`
          *,
          chain_players (user_id)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setChains(data || [])
    } catch (error) {
      console.error('Error fetching chains:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return '⏳'
      case 'active': return '🎨'
      case 'completed': return '✅'
      default: return '📝'
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse Chains</h1>
            <p className="text-gray-600 mt-2">Join an ongoing artwork or start your own</p>
          </div>
          
          <Button onClick={() => router.push('/chains/new')}>
            <Plus className="w-4 h-4" /> New Chain
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={filter === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Chains
          </Button>
          <Button
            variant={filter === 'waiting' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('waiting')}
          >
            ⏳ Waiting
          </Button>
          <Button
            variant={filter === 'active' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            🎨 Active
          </Button>
          <Button
            variant={filter === 'completed' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            ✅ Completed
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchChains}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card-soft animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : chains.length === 0 ? (
          <div className="text-center py-12">
            <Palette className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No chains found</h3>
            <p className="text-gray-600 mb-6">Be the first to create a chain!</p>
            <Button onClick={() => router.push('/chains/new')}>
              <Plus className="w-4 h-4" /> Create First Chain
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chains.map((chain) => (
              <div key={chain.id} className="card-soft hover:shadow-soft-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-gray-900 truncate">{chain.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chain.status)}`}>
                    {getStatusIcon(chain.status)} {chain.status.charAt(0).toUpperCase() + chain.status.slice(1)}
                  </span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">
                      {chain.chain_players?.length || 0} / {chain.max_players} players
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {new Date(chain.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => router.push(`/chains/${chain.id}`)}
                  className="w-full"
                  variant={chain.status === 'waiting' ? 'primary' : 'secondary'}
                >
                  {chain.status === 'waiting' ? 'Join Chain' : 'View Chain'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}