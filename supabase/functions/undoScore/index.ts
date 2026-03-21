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
    const { score_id, admin_id } = await req.json()

    if (!score_id || !admin_id) {
      throw new Error('Missing required fields')
    }

    const supabaseUrl = Deno.env.get('URL')
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Ensure admin exists
    const { data: admin, error: adminCheckError } = await supabase
      .from('admins')
      .select('admin_id')
      .eq('admin_id', admin_id)
      .single()
    if (adminCheckError || !admin) throw new Error('Invalid Admin ID')

    // Fetch score
    const { data: score, error: scoreError } = await supabase
      .from('scores')
      .select('points, student_id, game_id, created_by')
      .eq('score_id', score_id)
      .single()

    if (scoreError || !score) {
      throw new Error('Score not found')
    }

    // Ensure created_by == admin_id
    if (score.created_by !== admin_id) {
      throw new Error('You can only undo scores you created')
    }

    // Ensure created within last 60 seconds
    const createdAt = new Date(score.created_at).getTime()
    const now = new Date().getTime()
    if (now - createdAt > 60000) {
      throw new Error('Undo timeout (only allowed within 60 seconds of creation)')
    }

    // Delete score
    const { error: deleteError } = await supabase
      .from('scores')
      .delete()
      .eq('score_id', score_id)
    if (deleteError) throw deleteError

    // Fetch student to update points accurately
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('total_points')
      .eq('student_id', score.student_id)
      .single()
    if (studentError) throw studentError

    const newTotalPoints = Math.max(0, (student.total_points || 0) - score.points)

    // Update total_points -= points
    const { error: updateError } = await supabase
      .from('students')
      .update({ total_points: newTotalPoints })
      .eq('student_id', score.student_id)
    if (updateError) throw updateError

    // Insert DELETE log
    const { error: logError } = await supabase
      .from('score_logs')
      .insert([{
        action_type: 'DELETE',
        score_id: score_id,
        points: score.points,
        old_points: score.points,
        student_id: score.student_id,
        created_by: admin_id,
        game_id: score.game_id
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
