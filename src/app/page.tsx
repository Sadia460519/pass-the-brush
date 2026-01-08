'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Palette, Users, ArrowRight, Sparkles, Brush, Timer, Share2, Trophy, Star, ArrowLeft, LogIn, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [activeChains, setActiveChains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    loadActiveChains()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadActiveChains = async () => {
    const { data } = await supabase
      .from('chains')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(4)
    
    setActiveChains(data || [])
    setLoading(false)
  }

  const joinAsGuest = async () => {
    // Create anonymous session
    const { error } = await supabase.auth.signInAnonymously()
    if (!error) {
      router.push('/join')
    }
  }

  const handleSignIn = async () => {
    // Simple email magic link for testing
    const email = prompt('Enter your email (for testing):')
    if (!email) return
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      console.error('Sign in error:', error)
      alert('Error sending magic link. Please try again.')
    } else {
      alert('Check your email for the login link!')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-blue-50">
      {/* Fixed Header with Auth */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
              <Palette className="w-6 h-6 text-pink-500" />
              <span className="text-lg font-bold text-gray-900">Pass the Brush</span>
            </div>
            
            <div>
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-gray-700 hidden sm:inline">
                      {user.email?.split('@')[0] || user.user_metadata?.name || 'Guest'}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSignIn}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Adjusted padding for fixed header */}
      <div className="relative overflow-hidden pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pt-12 sm:pb-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 mb-6 animate-bounce">
              <Palette className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight">
              Pass the <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Brush</span>
            </h1>
            
            <p className="mt-6 text-xl sm:text-2xl text-gray-700 max-w-3xl mx-auto">
              Create collaborative art with friends in real-time. Draw, pass, and see what masterpiece emerges!
            </p>

            {/* Stats Bar */}
            <div className="mt-10 inline-flex items-center gap-6 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 border border-pink-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">2+</div>
                <div className="text-sm text-gray-600">Artists</div>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">30s</div>
                <div className="text-sm text-gray-600">Per Turn</div>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">3</div>
                <div className="text-sm text-gray-600">Rounds</div>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">∞</div>
                <div className="text-sm text-gray-600">Creativity</div>
              </div>
            </div>
          </div>

          {/* Main Action Buttons */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => router.push('/chains/new')}
                className="group h-24 md:h-28 bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 text-white rounded-2xl"
              >
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Palette className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  </div>
                  <span className="text-xl font-bold block">Create Game Room</span>
                  <span className="text-sm opacity-90 block mt-1">Start a new art collaboration</span>
                </div>
              </button>
              
              <button 
                onClick={() => router.push('/join')}
                className="group h-24 md:h-28 border-2 border-blue-300 hover:border-blue-400 bg-white/80 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
              >
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <LogIn className="w-8 h-8 text-blue-600 group-hover:translate-x-1 transition-transform" />
                    <Share2 className="w-6 h-6 text-blue-500 group-hover:rotate-12 transition-transform" />
                  </div>
                  <span className="text-xl font-bold text-gray-900 block">Join with Code</span>
                  <span className="text-sm text-gray-600 block mt-1">Enter a friend's room code</span>
                </div>
              </button>
            </div>

            {/* Quick Join Active Rooms */}
            {activeChains.length > 0 && (
              <div className="mt-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Active Rooms Waiting for Players</h3>
                <div className="space-y-3 max-w-md mx-auto">
                  {activeChains.map((chain) => (
                    <div
                      key={chain.id}
                      className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-pink-300 hover:shadow-md transition-all duration-300 cursor-pointer"
                      onClick={() => router.push(`/room/${chain.room_code}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 group-hover:text-pink-600">{chain.title}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1 text-sm text-gray-600">
                              <Users className="w-4 h-4" /> 
                              {chain.current_players || 1}/{chain.max_players}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-gray-600">
                              <Timer className="w-4 h-4" /> 
                              {chain.round_time}s
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-pink-100 text-pink-800 rounded-lg font-bold">
                            {chain.room_code}
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-pink-500 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guest Access */}
            {!user && (
              <div className="mt-8 text-center">
                <button
                  onClick={joinAsGuest}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-center gap-2 mx-auto"
                >
                  <span>Want to try? Join as a guest</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How the Game Works</h2>
            <p className="mt-4 text-lg text-gray-600">Create art together in 4 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative bg-white p-6 rounded-2xl border border-gray-200">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pink-100 text-pink-600 mb-4">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create or Join</h3>
                <p className="text-gray-600">
                  Create a room and share the code, or join a friend's room. Minimum 2 players to start.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative bg-white p-6 rounded-2xl border border-gray-200">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mb-4">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Topic</h3>
                <p className="text-gray-600">
                  First player picks 1 of 3 random topics. Everyone draws based on this theme.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-green-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative bg-white p-6 rounded-2xl border border-gray-200">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Draw & Pass</h3>
                <p className="text-gray-600">
                  Each player draws for 30 seconds, then passes clockwise. 3 rounds total.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-yellow-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative bg-white p-6 rounded-2xl border border-gray-200">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                  <span className="text-xl font-bold">4</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Reveal Masterpiece</h3>
                <p className="text-gray-600">
                  After all rounds, the final collaborative artwork is revealed to everyone!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why You'll Love It</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pink-100 text-pink-600 mb-4">
                <Brush className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Artistic Skills Needed</h3>
              <p className="text-gray-600">
                Whether you're Picasso or stick-figure champion, everyone can contribute to the fun.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mb-4">
                <Timer className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick & Engaging</h3>
              <p className="text-gray-600">
                Each turn is just 30 seconds. Perfect for quick brain breaks or long creative sessions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Social & Collaborative</h3>
              <p className="text-gray-600">
                Connect with friends, family, or meet new creative minds from around the world.
              </p>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-pink-50 to-blue-50 rounded-2xl p-8 border border-pink-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Alex, Digital Artist</h4>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-lg text-gray-700 italic">
                "Pass the Brush transformed our virtual hangouts! We went from 'Netflix and chill' to creating hilarious masterpieces together. The 30-second timer keeps it exciting!"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Create Something Amazing?</h2>
          <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
            Join thousands of artists creating unexpected masterpieces together
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/chains/new')}
              className="bg-white text-pink-600 hover:bg-pink-50 px-8 py-4 text-lg font-semibold rounded-xl flex items-center justify-center gap-2 mx-auto sm:mx-0"
            >
              <Palette className="w-5 h-5" />
              Start Creating
            </button>
            <button
              onClick={() => router.push('/join')}
              className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-xl flex items-center justify-center gap-2 mx-auto sm:mx-0"
            >
              <Share2 className="w-5 h-5" />
              Join a Room
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Palette className="w-6 h-6 text-pink-400" />
              <span className="text-lg font-bold text-white">Pass the Brush</span>
            </div>
            <div className="text-sm">
              <p>© {new Date().getFullYear()} Pass the Brush. All drawings belong to their creators.</p>
              <p className="mt-1">Made with ❤️ for creative minds everywhere</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}