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
    const { student_id, game_id, points, admin_id } = await req.json()

    // Validate inputs
    if (!student_id || !game_id || points === undefined || !admin_id) {
      throw new Error('Missing required fields')
    }
    if (points <= 0) {
      throw new Error('Points must be greater than 0')
    }

    const supabaseUrl = Deno.env.get('URL')
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY')

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Validate admin_id exists
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('admin_id')
      .eq('admin_id', admin_id)
      .single()
    if (adminError || !admin) throw new Error('Invalid Admin ID')

    // Validate game is ACTIVE
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('status')
      .eq('game_id', game_id)
      .single()
    if (gameError || !game) throw new Error('Invalid Game ID')
    if (game.status !== 'ACTIVE') throw new Error('Game is not active')

    // Insert into scores
    const { data: score, error: scoreError } = await supabase
      .from('scores')
      .insert([{ student_id, game_id, points, created_by: admin_id }])
      .select('score_id')
      .single()
    if (scoreError) throw scoreError

    // Fetch student's current points
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('total_points')
      .eq('student_id', student_id)
      .single()
    if (studentError) throw studentError

    const newTotalPoints = (student.total_points || 0) + points

    // Update students.total_points
    const { error: updateError } = await supabase
      .from('students')
      .update({ total_points: newTotalPoints })
      .eq('student_id', student_id)
    if (updateError) throw updateError

    // Insert into score_logs
    const { error: logError } = await supabase
      .from('score_logs')
      .insert([{
        action_type: 'ADD',
        score_id: score.score_id,
        points: points,
        new_points: points,
        student_id,
        created_by: admin_id,
        game_id
      }])
    if (logError) throw logError

    return new Response(
      JSON.stringify({ success: true, score_id: score.score_id, total_points: newTotalPoints }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
