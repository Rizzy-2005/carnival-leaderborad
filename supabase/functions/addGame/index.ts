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
    const { game_name, admin_id } = await req.json()

    if (!game_name || !admin_id) {
      throw new Error('Missing required fields')
    }

    const supabaseUrl = Deno.env.get('URL')
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify requesting admin is SUPER_ADMIN
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('role')
      .eq('admin_id', admin_id)
      .single()

    if (adminError || !admin) throw new Error('Invalid Admin ID')
    if (admin.role !== 'SUPER_ADMIN') throw new Error('Only SUPER_ADMIN can add games')

    // Add new game
    const { data: newGame, error: insertError } = await supabase
      .from('games')
      .insert([{ game_name, status: 'ACTIVE' }])
      .select()
      .single()

    if (insertError) throw insertError

    return new Response(
      JSON.stringify({ success: true, game: newGame }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
