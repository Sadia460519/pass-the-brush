'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Timer, Users, Check, ArrowRight, Palette, RotateCcw } from 'lucide-react'
import { formatTime } from '@/lib/game-utils'

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.code as string
  const supabase = createClient()

  const [room, setRoom] = useState<any>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [canvasData, setCanvasData] = useState('')
  const [timeLeft, setTimeLeft] = useState(30)
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    loadGameData()

    // Real-time subscriptions
    const roomSub = supabase
      .channel(`game-${roomCode}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chains', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          setRoom(payload.new)
        }
      )
      .subscribe()

    return () => {
      roomSub.unsubscribe()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [roomCode])

  const loadGameData = async () => {
    const { data: userData } = await supabase.auth.getUser()
    setCurrentUser(userData.user)

    const { data: roomData } = await supabase
      .from('chains')
      .select('*')
      .eq('room_code', roomCode)
      .single()

    setRoom(roomData)
    setTimeLeft(roomData?.round_time || 30)

    // Load players
    const { data: playersData } = await supabase
      .from('chain_players')
      .select(`
        *,
        profiles:user_id (
          username
        )
      `)
      .eq('chain_id', roomData.id)
      .order('join_order', { ascending: true })

    setPlayers(playersData || [])
  }

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          handleTurnComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleTopicSelect = async (topic: string) => {
    if (!room) return

    const { error } = await supabase
      .from('chains')
      .update({
        selected_topic: topic,
        game_state: 'drawing',
        current_player_index: 0
      })
      .eq('id', room.id)

    if (!error) {
      setSelectedTopic(topic)
      startTimer()
    }
  }

  const handleTurnComplete = async () => {
    if (!room || !currentUser) return

    // Save canvas data
    const canvas = canvasRef.current
    if (canvas) {
      const dataUrl = canvas.toDataURL()
      setCanvasData(dataUrl)

      // Save to database
      await supabase
        .from('chain_players')
        .update({ canvas_data: dataUrl })
        .eq('chain_id', room.id)
        .eq('user_id', currentUser.id)
    }

    // Move to next player
    const nextPlayerIndex = (room.current_player_index + 1) % players.length
    const isRoundComplete = nextPlayerIndex === 0

    if (isRoundComplete) {
      const nextRound = room.current_round + 1
      
      if (nextRound > room.max_rounds) {
        // Game complete
        await supabase
          .from('chains')
          .update({
            game_state: 'completed',
            status: 'completed'
          })
          .eq('id', room.id)
      } else {
        // Next round
        await supabase
          .from('chains')
          .update({
            current_round: nextRound,
            current_player_index: 0
          })
          .eq('id', room.id)
      }
    } else {
      // Next player same round
      await supabase
        .from('chains')
        .update({
          current_player_index: nextPlayerIndex
        })
        .eq('id', room.id)
    }
  }

  const isCurrentPlayer = () => {
    if (!room || !currentUser || players.length === 0) return false
    const currentPlayer = players[room.current_player_index]
    return currentPlayer?.user_id === currentUser.id
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading game...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Game Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{room.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 text-gray-700">
                <Users className="w-5 h-5" />
                <span>Room: <strong>{roomCode}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <RotateCcw className="w-5 h-5" />
                <span>Round {room.current_round} of 3</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-white border border-purple-300 rounded-lg">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-purple-500" />
                <span className="font-bold text-xl">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <button
              onClick={() => router.push(`/room/${roomCode}`)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Back to Room
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Game Info & Players */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Players</h2>
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`p-3 rounded-lg flex items-center gap-3 ${
                      room.current_player_index === index
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-300'
                        : 'bg-gray-50'
                    } ${
                      player.user_id === currentUser?.id ? 'border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      room.current_player_index === index
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {player.profiles?.username || 'Player ' + (index + 1)}
                        {player.user_id === currentUser?.id && ' (You)'}
                      </p>
                    </div>
                    {room.current_player_index === index && (
                      <Palette className="w-5 h-5 text-purple-500 animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Topic Display */}
            {room.selected_topic && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-semibold text-green-800 mb-2">Drawing Topic</h3>
                <p className="text-xl font-bold text-green-900">{room.selected_topic}</p>
                <p className="text-sm text-green-700 mt-2">
                  All players draw based on this theme
                </p>
              </div>
            )}
          </div>

          {/* Middle Column - Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Canvas</h2>
                {isCurrentPlayer() && room.game_state === 'drawing' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Your turn!</span>
                    <button
                      onClick={handleTurnComplete}
                      className="flex items-center gap-2 px-3 py-1.5 border border-green-300 text-green-700 hover:bg-green-50 rounded-lg transition-colors text-sm"
                    >
                      <Check className="w-4 h-4" /> Done
                    </button>
                  </div>
                )}
              </div>

              {/* Topic Selection (if first player) */}
              {room.game_state === 'topic_selection' && isCurrentPlayer() && (
                <div className="mb-6 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                  <h3 className="text-xl font-bold text-purple-900 mb-4">
                    🎯 Choose a Topic for the Game!
                  </h3>
                  <p className="text-gray-700 mb-4">
                    You're first! Pick one topic that everyone will draw:
                  </p>
                  <div className="space-y-3">
                    {(room.topic_options || []).map((topic: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleTopicSelect(topic)}
                        className="w-full text-left p-4 border border-gray-300 hover:border-purple-300 hover:bg-purple-50 rounded-lg transition-all duration-200"
                      >
                        <div className="flex items-start">
                          <span className="text-lg mr-3">🎨</span>
                          <div>
                            <p className="font-medium text-gray-900">{topic}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Click to select this theme
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Canvas Area */}
              <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="w-full h-auto bg-white"
                  style={{ cursor: isCurrentPlayer() ? 'crosshair' : 'not-allowed' }}
                  onMouseDown={() => isCurrentPlayer() && setIsDrawing(true)}
                  onMouseUp={() => setIsDrawing(false)}
                  onMouseMove={(e) => {
                    if (!isDrawing || !isCurrentPlayer() || !canvasRef.current) return
                    
                    const ctx = canvasRef.current.getContext('2d')
                    if (!ctx) return

                    const rect = canvasRef.current.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const y = e.clientY - rect.top

                    ctx.lineWidth = 2
                    ctx.lineCap = 'round'
                    ctx.strokeStyle = '#ec4899'
                    ctx.lineTo(x, y)
                    ctx.stroke()
                    ctx.beginPath()
                    ctx.moveTo(x, y)
                  }}
                />
              </div>

              {/* Drawing Tools */}
              {isCurrentPlayer() && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Drawing Tools</h4>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg text-sm">
                      Brush
                    </button>
                    <button className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg text-sm">
                      Eraser
                    </button>
                    <button className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg text-sm">
                      Clear
                    </button>
                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        type="color"
                        className="w-8 h-8 cursor-pointer"
                        defaultValue="#ec4899"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Game Status */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                <h3 className="font-semibold text-blue-800 mb-2">Game Status</h3>
                {room.game_state === 'topic_selection' && (
                  <p className="text-blue-700">
                    ⏳ Waiting for first player to choose a topic...
                  </p>
                )}
                {room.game_state === 'drawing' && (
                  <div className="space-y-2">
                    <p className="text-green-700">
                      🎨 <strong>{players[room.current_player_index]?.profiles?.username || 'Current player'}</strong> is drawing...
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${(timeLeft / room.round_time) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Time left: {formatTime(timeLeft)} / {formatTime(room.round_time)}
                    </p>
                  </div>
                )}
                {room.game_state === 'completed' && (
                  <div className="text-center">
                    <p className="text-xl font-bold text-purple-700 mb-2">
                      🎉 Game Complete! 🎉
                    </p>
                    <button
                      onClick={() => router.push(`/room/${roomCode}/results`)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                    >
                      View Final Masterpiece
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}