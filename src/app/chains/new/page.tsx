'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Palette, Users, ArrowLeft, AlertCircle, Copy, Users2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateRoomCode } from '@/lib/game-utils'

export default function NewRoomPage() {
  const [title, setTitle] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [roundTime, setRoundTime] = useState(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Generate room code on component mount
  useEffect(() => {
    setRoomCode(generateRoomCode())
  }, [])

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create room (chain)
      const { data: room, error: roomError } = await supabase
        .from('chains')
        .insert({
          title,
          room_code: roomCode,
          max_players: maxPlayers,
          creator_id: user.id,
          status: 'waiting',
          game_state: 'waiting',
          round_time: roundTime,
          max_rounds: 3,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Add creator as first player
      const { error: playerError } = await supabase
        .from('chain_players')
        .insert({
          chain_id: room.id,
          user_id: user.id,
          position: 1,
          join_order: 1,
          status: 'waiting'
        })

      if (playerError) throw playerError

      // Redirect to room page
      router.push(`/room/${roomCode}`)
    } catch (error: any) {
      setError(error.message || 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      alert('Room code copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-8 bg-gradient-to-b from-pink-50 to-white">
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
            <h1 className="text-2xl font-bold text-gray-900">Create Game Room</h1>
            <p className="text-gray-600 mt-2">Start a Pass the Brush game</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleCreateRoom} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Room Title
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
                placeholder="Funny Cat Art Party, Abstract Doodle Jam..."
              />
            </div>

            {/* Room Code Display */}
<div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-xl border border-pink-200">
  <label className="block text-sm font-medium text-pink-700 mb-2">
    Room Code
  </label>
  <div className="flex items-center gap-3">
    <div className="text-2xl font-bold tracking-wider bg-white px-4 py-2 rounded-lg border border-pink-300 flex-1 text-center">
      {roomCode}
    </div>
    <button
      type="button"
      onClick={copyRoomCode}
      className="flex items-center gap-2 px-4 py-2 border border-pink-300 rounded-lg text-pink-700 hover:bg-pink-50 hover:border-pink-400 transition-colors duration-200"
    >
      <Copy className="w-4 h-4" /> Copy
    </button>
  </div>
  <p className="text-sm text-gray-600 mt-2">
    Share this code with friends so they can join your room
  </p>
</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Artists (2 minimum to start)
              </label>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-pink-500" />
                <span className="text-lg font-semibold">{maxPlayers} artists max</span>
              </div>
              <input
                type="range"
                min="2"
                max="10"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                className="w-full h-2 bg-pink-100 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>2 (minimum)</span>
                <span>10 (maximum)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time per Turn (seconds)
              </label>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-semibold">{roundTime} seconds</span>
              </div>
              <input
                type="range"
                min="10"
                max="180"
                step="10"
                value={roundTime}
                onChange={(e) => setRoundTime(parseInt(e.target.value))}
                className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>10s (fast)</span>
                <span>180s (detailed)</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Each artist gets this time to draw their part
              </p>
            </div>

            <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
              <h3 className="font-medium text-pink-700 mb-2">How the game works:</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <Users2 className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Share the room code</strong> with friends (minimum 2 players to start)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500">①</span>
                  <span><strong>First player chooses</strong> 1 of 3 random topics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500">⏱️</span>
                  <span><strong>Each player draws for {roundTime} seconds</strong>, then passes the canvas clockwise</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500">🔄</span>
                  <span><strong>3 rounds total</strong> - canvas returns to first player after each round</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500">🎨</span>
                  <span><strong>Final masterpiece revealed</strong> after all rounds!</span>
                </li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Room...' : 'Create Game Room'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}