import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { score_id, new_points, admin_id } = await req.json()

    if (!score_id || new_points === undefined || !admin_id) {
      throw new Error('Missing required fields')
    }
    
    if (new_points <= 0) {
      throw new Error('New points must be greater than 0')
    }

    const supabaseUrl = Deno.env.get('URL')
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify admin role = SUPER_ADMIN
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('role')
      .eq('admin_id', admin_id)
      .single()
    if (adminError || !admin) throw new Error('Invalid Admin ID')
    if (admin.role !== 'SUPER_ADMIN') throw new Error('Only SUPER_ADMIN can edit scores')

    // Fetch old score
    const { data: oldScore, error: scoreError } = await supabase
      .from('scores')
      .select('points, student_id, game_id')
      .eq('score_id', score_id)
      .single()
    if (scoreError || !oldScore) throw new Error('Score not found')

    const pointDifference = new_points - oldScore.points

    if (pointDifference === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Points are the same' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update score
    const { error: updateScoreError } = await supabase
      .from('scores')
      .update({ points: new_points })
      .eq('score_id', score_id)
    if (updateScoreError) throw updateScoreError

    // Fetch student current points
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('total_points')
      .eq('student_id', oldScore.student_id)
      .single()
    if (studentError) throw studentError

    const newTotalPoints = Math.max(0, (student.total_points || 0) + pointDifference)

    // Update total_points accordingly
    const { error: updatePointsError } = await supabase
      .from('students')
      .update({ total_points: newTotalPoints })
      .eq('student_id', oldScore.student_id)
    if (updatePointsError) throw updatePointsError

    // Insert EDIT log (old_points, new_points)
    const { error: logError } = await supabase
      .from('score_logs')
      .insert([{
        action_type: 'EDIT',
        score_id: score_id,
        points: new_points,
        old_points: oldScore.points,
        new_points: new_points,
        student_id: oldScore.student_id,
        created_by: admin_id,
        game_id: oldScore.game_id
      }])
    if (logError) throw logError

    return new Response(
      JSON.stringify({ success: true, total_points: newTotalPoints }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
