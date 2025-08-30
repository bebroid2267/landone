import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all active challenges with user progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Fetch all active challenges
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('difficulty', { ascending: true })
      .order('reward_points', { ascending: false })

    if (challengesError) {
      console.error('Error fetching challenges:', challengesError)
      return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
    }

    // Fetch user's progress on challenges
    const { data: userChallenges, error: userChallengesError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', userId)

    if (userChallengesError) {
      console.error('Error fetching user challenges:', userChallengesError)
      return NextResponse.json({ error: 'Failed to fetch user challenges' }, { status: 500 })
    }

    // Combine challenges with user progress
    const challengesWithProgress = challenges.map(challenge => {
      const userChallenge = userChallenges?.find(uc => uc.challenge_id === challenge.id)
      
      return {
        ...challenge,
        userProgress: userChallenge ? {
          status: userChallenge.status,
          progress: userChallenge.progress_percentage || 0,
          startedAt: userChallenge.started_at,
          completedAt: userChallenge.completed_at,
          deadline: userChallenge.deadline,
          currentValue: userChallenge.current_value,
          pointsEarned: userChallenge.points_earned
        } : {
          status: 'not_started',
          progress: 0,
          startedAt: null,
          completedAt: null,
          deadline: null,
          currentValue: null,
          pointsEarned: 0
        }
      }
    })

    return NextResponse.json({ challenges: challengesWithProgress })
  } catch (error) {
    console.error('Error in challenges API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Start a new challenge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, challengeId } = body

    if (!userId || !challengeId) {
      return NextResponse.json({ error: 'User ID and Challenge ID are required' }, { status: 400 })
    }

    // Check if user already has this challenge
    const { data: existingChallenge, error: checkError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing challenge:', checkError)
      return NextResponse.json({ error: 'Failed to check existing challenge' }, { status: 500 })
    }

    if (existingChallenge) {
      return NextResponse.json({ error: 'Challenge already started' }, { status: 400 })
    }

    // Get challenge details to calculate deadline
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('duration_days')
      .eq('id', challengeId)
      .single()

    if (challengeError) {
      console.error('Error fetching challenge details:', challengeError)
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    const startedAt = new Date().toISOString()
    const deadline = new Date(Date.now() + challenge.duration_days * 24 * 60 * 60 * 1000).toISOString()

    // Create user challenge entry
    const { data: userChallenge, error: insertError } = await supabase
      .from('user_challenges')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        status: 'in_progress',
        started_at: startedAt,
        deadline: deadline
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating user challenge:', insertError)
      return NextResponse.json({ error: 'Failed to start challenge' }, { status: 500 })
    }

    return NextResponse.json({ userChallenge })
  } catch (error) {
    console.error('Error in start challenge API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update challenge progress
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, challengeId, currentValue } = body

    if (!userId || !challengeId || currentValue === undefined) {
      return NextResponse.json({ error: 'User ID, Challenge ID, and current value are required' }, { status: 400 })
    }

    // Update user challenge progress
    const { data: userChallenge, error: updateError } = await supabase
      .from('user_challenges')
      .update({
        current_value: currentValue,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating challenge progress:', updateError)
      return NextResponse.json({ error: 'Failed to update challenge progress' }, { status: 500 })
    }

    return NextResponse.json({ userChallenge })
  } catch (error) {
    console.error('Error in update challenge API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}