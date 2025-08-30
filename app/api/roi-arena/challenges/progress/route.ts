import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, metrics } = body

    if (!userId || !metrics) {
      return NextResponse.json({ error: 'User ID and metrics are required' }, { status: 400 })
    }

    // Get all in-progress challenges for the user
    const { data: userChallenges, error: challengesError } = await supabase
      .from('user_challenges')
      .select(`
        *,
        challenges!inner(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'in_progress')

    if (challengesError) {
      console.error('Error fetching user challenges:', challengesError)
      return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
    }

    const newlyCompleted = []
    const updates = []

    for (const userChallenge of userChallenges || []) {
      const challenge = userChallenge.challenges
      const targetMetric = challenge.target_metric
      const targetValue = challenge.target_value
      const targetOperator = challenge.target_operator
      
      // Get current value based on target metric
      let currentValue = 0
      switch (targetMetric.toLowerCase()) {
        case 'roas':
          currentValue = metrics.roas
          break
        case 'ctr':
          currentValue = metrics.ctr
          break
        case 'conversions':
          currentValue = metrics.conversions
          break
        case 'cost':
          currentValue = metrics.cost
          break
        case 'revenue':
          currentValue = metrics.revenue
          break
        case 'impressions':
          currentValue = metrics.impressions
          break
        case 'cpc':
          currentValue = metrics.cpc || (metrics.conversions > 0 ? metrics.cost / metrics.conversions : 0)
          break
        case 'quality score':
          currentValue = metrics.qualityScore || 0
          break
        case 'budget utilization':
          currentValue = metrics.budgetUtilization || 0
          break
        default:
          continue
      }

      // Calculate progress percentage
      let progress = 0
      let isCompleted = false

      if (targetOperator === '>=' || targetOperator === '>') {
        progress = Math.min(100, (currentValue / targetValue) * 100)
        isCompleted = targetOperator === '>=' ? currentValue >= targetValue : currentValue > targetValue
      } else if (targetOperator === '<=' || targetOperator === '<') {
        progress = currentValue <= targetValue ? 100 : Math.max(0, 100 - ((currentValue - targetValue) / targetValue) * 100)
        isCompleted = targetOperator === '<=' ? currentValue <= targetValue : currentValue < targetValue
      }

      // Check if deadline has passed
      const deadline = new Date(userChallenge.deadline)
      const now = new Date()
      const isExpired = now > deadline

      let newStatus = userChallenge.status
      let pointsEarned = userChallenge.points_earned

      if (isCompleted && !isExpired) {
        newStatus = 'completed'
        pointsEarned = challenge.reward_points
        newlyCompleted.push({
          id: challenge.id,
          title: challenge.title,
          pointsEarned: challenge.reward_points
        })
      } else if (isExpired && !isCompleted) {
        newStatus = 'failed'
      }

      updates.push({
        id: userChallenge.id,
        user_id: userId,
        challenge_id: userChallenge.challenge_id,
        current_value: currentValue,
        progress_percentage: Math.round(progress),
        status: newStatus,
        points_earned: pointsEarned,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : userChallenge.completed_at,
        updated_at: new Date().toISOString()
      })
    }

    // Update all challenges in batch
    if (updates.length > 0) {
      const { error: updateError } = await supabase
        .from('user_challenges')
        .upsert(updates)

      if (updateError) {
        console.error('Error updating challenges:', updateError)
        return NextResponse.json({ error: 'Failed to update challenges' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      updatedChallenges: updates.length,
      newlyCompleted 
    })

  } catch (error) {
    console.error('Error in challenge progress update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}