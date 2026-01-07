'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Palette, Users, ArrowLeft, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function NewChainPage() {
  const [title, setTitle] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleCreateChain = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create chain
      const { data: chain, error: chainError } = await supabase
        .from('chains')
        .insert({
          title,
          max_players: maxPlayers,
          creator_id: user.id,
          status: 'waiting',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single()

      if (chainError) throw chainError

      // Add creator as first player
      const { error: playerError } = await supabase
        .from('chain_players')
        .insert({
          chain_id: chain.id,
          user_id: user.id,
          position: 1,
          status: 'waiting'
        })

      if (playerError) throw playerError

      router.push(`/chains/${chain.id}`)
    } catch (error: any) {
      setError(error.message || 'Failed to create chain')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <div className="card-soft">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-accent-pink mb-4">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Chain</h1>
            <p className="text-gray-600 mt-2">Start a collaborative art piece</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleCreateChain} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Chain Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                className="w-full px-4 py-3 rounded-lg border border-cream-300 focus:border-pink-300 focus:ring-2 focus:ring-pink-200 focus:ring-opacity-50 outline-none transition"
                placeholder="Funny Cat Portrait, Abstract Dreams..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Artists
              </label>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-pink-500" />
                <span className="text-lg font-semibold">{maxPlayers} artists</span>
              </div>
              <input
                type="range"
                min="2" // CHANGED FROM 3 TO 2
                max="10"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                className="w-full h-2 bg-pink-100 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>2 (minimum)</span> {/* CHANGED FROM 3 TO 2 */}
                <span>10 (maximum)</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Each artist will add one layer to the artwork. Chain starts when all spots are filled.
              </p>
            </div>

            <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
              <h3 className="font-medium text-pink-700 mb-2">How it works:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• You'll be the first artist in the chain</li>
                <li>• Chain will wait for others to join (max 24 hours)</li>
                <li>• When full, artists take turns drawing for 60 seconds each</li>
                <li>• Final artwork will be shown to all participants</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Chain'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}