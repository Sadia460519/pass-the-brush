'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, LogIn, Key } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in to join a room')

      // Find room by code
      const { data: room, error: roomError } = await supabase
        .from('chains')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .eq('status', 'waiting')
        .single()

      if (roomError) throw new Error('Room not found or game already started')
      
      // Check if room is full
      const { count: playerCount } = await supabase
        .from('chain_players')
        .select('*', { count: 'exact', head: true })
        .eq('chain_id', room.id)

      if (playerCount && playerCount >= room.max_players) {
        throw new Error('Room is full')
      }

      // Check if user already in room
      const { data: existingPlayer } = await supabase
        .from('chain_players')
        .select('id')
        .eq('chain_id', room.id)
        .eq('user_id', user.id)
        .single()

      if (existingPlayer) {
        // User already in room, just redirect
        router.push(`/room/${roomCode}`)
        return
      }

      // Get join order
      const { count: newJoinOrder } = await supabase
        .from('chain_players')
        .select('*', { count: 'exact', head: true })
        .eq('chain_id', room.id)

      // Add player to room
      const { error: joinError } = await supabase
        .from('chain_players')
        .insert({
          chain_id: room.id,
          user_id: user.id,
          position: (newJoinOrder || 0) + 1,
          join_order: (newJoinOrder || 0) + 1,
          status: 'waiting'
        })

      if (joinError) throw joinError

      // Redirect to room
      router.push(`/room/${roomCode}`)
    } catch (error: any) {
      setError(error.message || 'Failed to join room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <div className="card-soft">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-accent-blue mb-4">
              <LogIn className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Join Game Room</h1>
            <p className="text-gray-600 mt-2">Enter a room code to join the game</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleJoinRoom} className="space-y-6">
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
                Room Code
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="roomCode"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  required
                  minLength={6}
                  maxLength={6}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-blue-300 focus:ring-2 focus:ring-blue-200 outline-none transition"
                  placeholder="ABCDEF"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Get the 6-character code from your friend who created the room
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Joining...' : 'Join Room'}
            </Button>

            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Don't have a room?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/chains/new')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Create one instead
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}