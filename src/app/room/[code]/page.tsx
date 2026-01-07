'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, Play, Copy, UserPlus, Clock, RotateCcw, ArrowLeft } from 'lucide-react'
import { formatTime } from '@/lib/game-utils'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.code as string
  const supabase = createClient()

  const [room, setRoom] = useState<any>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    loadRoomData()

    // Subscribe to real-time updates
    const roomSubscription = supabase
      .channel(`room-${roomCode}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chains', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          setRoom(payload.new)
        }
      )
      .subscribe()

    const playersSubscription = supabase
      .channel(`room-players-${roomCode}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chain_players' },
        () => {
          loadPlayers()
        }
      )
      .subscribe()

    return () => {
      roomSubscription.unsubscribe()
      playersSubscription.unsubscribe()
    }
  }, [roomCode])

  const loadRoomData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      setCurrentUser(userData.user)

      const { data: roomData } = await supabase
        .from('chains')
        .select('*')
        .eq('room_code', roomCode)
        .single()

      if (!roomData) {
        router.push('/join')
        return
      }

      setRoom(roomData)
      await loadPlayers()
    } catch (error) {
      console.error('Error loading room:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPlayers = async () => {
    if (!room) return

    const { data: playersData } = await supabase
      .from('chain_players')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .eq('chain_id', room.id)
      .order('join_order', { ascending: true })

    setPlayers(playersData || [])
  }

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      alert('Room code copied!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const startGame = async () => {
    if (!room || !currentUser) return
    if (room.creator_id !== currentUser.id) return
    if (players.length < 2) {
      alert('Need at least 2 players to start!')
      return
    }

    setStarting(true)
    try {
      // Get 3 random topics
      const { data: topics } = await supabase
        .from('topics')
        .select('text')
        .limit(3)

      const topicOptions = topics?.map(t => t.text) || [
        'A magical creature',
        'A futuristic city',
        'Something silly'
      ]

      // Update room to start game
      const { error } = await supabase
        .from('chains')
        .update({
          game_state: 'topic_selection',
          status: 'in_progress',
          selected_topic: null,
          current_player_index: 0,
          current_round: 1,
          topic_options: topicOptions
        })
        .eq('id', room.id)

      if (error) throw error

      // Redirect to game page
      router.push(`/game/${roomCode}`)
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Failed to start game')
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading room...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Room not found</h2>
          <p className="text-gray-600 mt-2">Check the room code and try again</p>
          <button
            onClick={() => router.push('/join')}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            Join a Room
          </button>
        </div>
      </div>
    )
  }

  const isHost = currentUser?.id === room.creator_id
  const canStart = isHost && players.length >= 2 && room.game_state === 'waiting'

  return (
    <div className="min-h-screen p-6 md:p-8 bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back Home
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Room:</span>
            <div className="px-4 py-2 bg-white border border-green-300 rounded-lg font-bold text-lg">
              {roomCode}
            </div>
            <button
              onClick={copyRoomCode}
              className="flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Room Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900">{room.title}</h1>
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="w-5 h-5" />
                  <span>{players.length} / {room.max_players} players</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-5 h-5" />
                  <span>{formatTime(room.round_time)} per turn</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <RotateCcw className="w-5 h-5" />
                  <span>3 rounds total</span>
                </div>
              </div>

              {/* Game Status */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                <h3 className="font-semibold text-blue-800 mb-2">Game Status</h3>
                {room.game_state === 'waiting' && (
                  <p className="text-blue-700">
                    ⏳ Waiting for players... ({players.length}/{room.max_players})
                  </p>
                )}
                {room.game_state === 'topic_selection' && (
                  <p className="text-purple-700">
                    🎯 First player choosing topic...
                  </p>
                )}
                {room.game_state === 'drawing' && (
                  <p className="text-green-700">
                    🎨 Round {room.current_round} - Player {room.current_player_index + 1}'s turn
                  </p>
                )}
              </div>

              {/* Start Button */}
              {canStart && (
                <div className="mt-6">
                  <button
                    onClick={startGame}
                    disabled={starting}
                    className="w-full py-4 px-6 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <Play className="w-5 h-5" />
                    {starting ? 'Starting...' : `Start Game (${players.length} players ready)`}
                  </button>
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Game will begin with the first player choosing a topic
                  </p>
                </div>
              )}

              {room.game_state !== 'waiting' && (
                <div className="mt-6">
                  <button
                    onClick={() => router.push(`/game/${roomCode}`)}
                    className="w-full py-4 px-6 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    {room.game_state === 'completed' ? 'View Results' : 'Enter Game'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Players List */}
          <div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Players</h2>
              <div className="space-y-3">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      player.user_id === currentUser?.id 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {player.profiles?.username || 'Anonymous'}
                        {player.user_id === room.creator_id && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Host</span>
                        )}
                        {player.user_id === currentUser?.id && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">You</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}

                {players.length < room.max_players && (
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <UserPlus className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {room.max_players - players.length} spots available
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Share the room code to invite friends
                    </p>
                  </div>
                )}
              </div>

              {/* Invite Section */}
              <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200">
                <h3 className="font-medium text-pink-700 mb-2">Invite Friends</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Share this code with friends:
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white px-4 py-2 rounded-lg border border-pink-300 text-center font-bold text-lg tracking-wider">
                    {roomCode}
                  </div>
                  <button
                    onClick={copyRoomCode}
                    className="flex items-center gap-2 px-4 py-2 border border-pink-300 text-pink-700 hover:bg-pink-50 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" /> Copy
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Minimum 2 players needed to start
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}