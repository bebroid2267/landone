import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch weekly leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0') // 0 = current week, -1 = last week, etc.
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Calculate week start date based on offset
    const currentDate = new Date()
    const currentWeekStart = new Date(currentDate)
    currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1) // Monday
    currentWeekStart.setHours(0, 0, 0, 0)
    
    const targetWeekStart = new Date(currentWeekStart)
    targetWeekStart.setDate(currentWeekStart.getDate() + (weekOffset * 7))
    
    const weekStartStr = targetWeekStart.toISOString().split('T')[0]
    
    // Fetch leaderboard data with user information
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('weekly_leaderboard')
      .select(`
        *
      `)
      .eq('week_start_date', weekStartStr)
      .order('rank_position', { ascending: true })
      .limit(limit)

    if (leaderboardError) {
      console.error('Error fetching leaderboard:', leaderboardError)
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }

    // Format the response
    const formattedLeaderboard = leaderboard?.map((entry, index) => ({
      rank: entry.rank_position || index + 1,
      userId: entry.user_id,
      name: entry.account_id ? `Account ${entry.account_id}` : 'Anonymous User',
      avatar: null,
      totalPoints: entry.total_points,
      challengesCompleted: entry.challenges_completed,
      averageRoas: entry.average_roas,
      weekStart: entry.week_start_date,
      weekEnd: entry.week_end_date
    })) || []

    // Get total participants count for this week
    const { count: totalParticipants, error: countError } = await supabase
      .from('weekly_leaderboard')
      .select('*', { count: 'exact', head: true })
      .eq('week_start_date', weekStartStr)

    if (countError) {
      console.error('Error counting participants:', countError)
    }

    return NextResponse.json({
      leaderboard: formattedLeaderboard,
      weekStart: weekStartStr,
      weekEnd: new Date(targetWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalParticipants: totalParticipants || 0,
      isCurrentWeek: weekOffset === 0
    })
  } catch (error) {
    console.error('Error in leaderboard API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Update user's weekly stats (called when challenges are completed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, averageRoas, accountId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Calculate current week
    const currentDate = new Date()
    const weekStart = new Date(currentDate)
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1) // Monday
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // Sunday
    
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    // Calculate user's stats for the current week
    const { data: userChallenges, error: challengesError } = await supabase
      .from('user_challenges')
      .select('points_earned')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', weekStart.toISOString())
      .lte('completed_at', new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000).toISOString())

    if (challengesError) {
      console.error('Error fetching user challenges:', challengesError)
      return NextResponse.json({ error: 'Failed to fetch user challenges' }, { status: 500 })
    }

    const totalPoints = userChallenges?.reduce((sum, challenge) => sum + (challenge.points_earned || 0), 0) || 0
    const challengesCompleted = userChallenges?.length || 0

    // Upsert weekly leaderboard entry
    const { data: leaderboardEntry, error: upsertError } = await supabase
      .from('weekly_leaderboard')
      .upsert({
        user_id: userId,
        week_start_date: weekStartStr,
        week_end_date: weekEndStr,
        total_points: totalPoints,
        challenges_completed: challengesCompleted,
        average_roas: averageRoas || null,
        account_id: accountId || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,week_start_date'
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Error upserting leaderboard entry:', upsertError)
      return NextResponse.json({ error: 'Failed to update leaderboard' }, { status: 500 })
    }

    // Update rankings for the current week
    await updateWeeklyRankings(weekStartStr)

    return NextResponse.json({ leaderboardEntry })
  } catch (error) {
    console.error('Error in update leaderboard API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to update weekly rankings
async function updateWeeklyRankings(weekStartDate: string) {
  try {
    // Get all entries for the week, ordered by points
    const { data: entries, error: fetchError } = await supabase
      .from('weekly_leaderboard')
      .select('id, user_id, total_points, challenges_completed, week_start_date, week_end_date, average_roas')
      .eq('week_start_date', weekStartDate)
      .order('total_points', { ascending: false })
      .order('challenges_completed', { ascending: false })

    if (fetchError) {
      console.error('Error fetching entries for ranking:', fetchError)
      return
    }

    // Update each entry with its rank
    const updates = entries?.map((entry, index) => ({
      id: entry.id,
      user_id: entry.user_id,
      week_start_date: entry.week_start_date,
      week_end_date: entry.week_end_date,
      total_points: entry.total_points,
      challenges_completed: entry.challenges_completed,
      average_roas: entry.average_roas,
      rank_position: index + 1,
      updated_at: new Date().toISOString()
    })) || []

    if (updates.length > 0) {
      const { error: updateError } = await supabase
        .from('weekly_leaderboard')
        .upsert(updates, { onConflict: 'id' })

      if (updateError) {
        console.error('Error updating rankings:', updateError)
      }
    }
  } catch (error) {
    console.error('Error in updateWeeklyRankings:', error)
  }
}