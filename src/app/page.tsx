'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Palette, Users, Clock, Sparkles, LogIn, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [])

  const handleStartCreating = () => {
    if (user) {
      router.push('/chains/new')
    } else {
      router.push('/auth/signup')
    }
  }

  const handleBrowseChains = () => {
    router.push('/chains')
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <header className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-accent-pink flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">
              <span className="text-gradient">Pass the Brush</span>
            </h1>
          </div>
          
          <div className="flex gap-4">
            {loading ? (
              <div className="animate-pulse h-10 w-20 bg-pink-100 rounded-xl"></div>
            ) : user ? (
              <Button variant="ghost" onClick={() => router.push('/profile')}>
                Profile
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push('/auth/login')}>
                  <LogIn className="w-4 h-4" /> Login
                </Button>
                <Button variant="primary" onClick={() => router.push('/auth/signup')}>
                  <UserPlus className="w-4 h-4" /> Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Beta Launch</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            <span className="text-gradient">Collaborative Art,</span>
            <br />
            <span className="text-gray-800">One Brushstroke at a Time</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Draw a little. Pass it on. Watch a masterpiece grow through shared creativity.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Button size="lg" className="shadow-soft-lg" onClick={handleStartCreating}>
              Start Creating
            </Button>
            <Button variant="secondary" size="lg" onClick={handleBrowseChains}>
              Browse Chains
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="card-soft text-center">
            <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-pink-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Chain Collaboration</h3>
            <p className="text-gray-600">
              Each artist adds one layer, building on the previous contribution
            </p>
          </div>
          
          <div className="card-soft text-center">
            <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-pink-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">60-Second Turns</h3>
            <p className="text-gray-600">
              Quick, creative bursts keep the energy flowing
            </p>
          </div>
          
          <div className="card-soft text-center">
            <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
              <Palette className="w-7 h-7 text-pink-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Simple Tools</h3>
            <p className="text-gray-600">
              Focus on creativity with our minimal, intuitive drawing tools
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}