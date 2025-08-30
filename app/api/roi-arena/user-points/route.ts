import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get total points from completed challenges
    const { data: userChallenges, error } = await supabase
      .from('user_challenges')
      .select('points_earned')
      .eq('user_id', userId)
      .eq('status', 'completed')

    if (error) {
      console.error('Error fetching user points:', error)
      return NextResponse.json({ error: 'Failed to fetch user points' }, { status: 500 })
    }

    const totalPoints = userChallenges?.reduce((sum, challenge) => sum + (challenge.points_earned || 0), 0) || 0

    return NextResponse.json({ 
      totalPoints,
      completedChallenges: userChallenges?.length || 0
    })

  } catch (error) {
    console.error('Error in user points endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}