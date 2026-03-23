import { supabase } from './supabaseClient'

// Students API
export const loginStudent = async (phone, username, college) => {
  // Check if exists
  let { data: student, error } = await supabase
    .from('students')
    .select('*')
    .eq('phone', phone)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  // Register if not found
  if (!student) {
    if (!username && !college) {
      const err = new Error('Phone not found. Please register.')
      err.code = 'USER_NOT_FOUND'
      throw err
    }
    if (!username || !college) throw new Error('Username and college required for registration')
    const { data: newStudent, error: insertError } = await supabase
      .from('students')
      .insert([{ phone, username, college }])
      .select()
      .single()
    if (insertError) {
      if (insertError.code === '23505' && (insertError.message.includes('username') || insertError.details?.includes('username'))) {
        throw new Error('This username is already taken. Please choose another one.')
      }
      throw insertError
    }
    student = newStudent
    student.isNewRecord = true
  }
  return student
}

export const getStudentDetails = async (studentId) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('student_id', studentId)
    .single()
  if (error) throw error
  return data
}

export const loginAdmin = async (username, password) => {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/loginAdmin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ username, password })
  })
  if (!res.ok) throw new Error('Edge Function returned a non-2xx status code')
  const data = await res.json()
  if (!data?.success) throw new Error(data?.error || 'Invalid credentials')
  return data.admin
}

export const fetchAdmins = async () => {
  const { data, error } = await supabase.from('admins').select('*')
  if (error) throw error
  return data
}

export const addAdmin = async (username, password, role, admin_id) => {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/addAdmin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ new_username: username, new_password: password, new_role: role, admin_id })
  })
  if (!res.ok) throw new Error('Edge Function error')
  const data = await res.json()
  if (!data?.success) throw new Error(data?.error || 'Failed to add admin')
  return data.admin
}

export const deleteAdmin = async (target_admin_id, admin_id) => {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deleteAdmin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ target_admin_id, admin_id })
  })
  if (!res.ok) throw new Error('Edge Function error')
  const data = await res.json()
  if (!data?.success) throw new Error(data?.error || 'Failed to delete admin')
  return data
}

// Games API
export const fetchGames = async () => {
  const { data, error } = await supabase.from('games').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export const fetchActiveGames = async () => {
  const { data, error } = await supabase.from('games').select('*').eq('status', 'ACTIVE')
  if (error) throw error
  return data
}

export const addGame = async (game_name, admin_id) => {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/addGame`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ game_name, admin_id })
  })
  if (!res.ok) throw new Error('Edge Function error')
  const data = await res.json()
  if (!data?.success) throw new Error(data?.error || 'Failed to add game')
  return data.game
}

export const toggleGameStatus = async (game_id, currentStatus, admin_id) => {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/toggleGameStatus`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ game_id, currentStatus, admin_id })
  })
  if (!res.ok) throw new Error('Edge Function error')
  const data = await res.json()
  if (!data?.success) throw new Error(data?.error || 'Failed to toggle status')
  return data.game
}

// Logs Data
export const fetchLogs = async (page = 0, limit = 20) => {
  const from = page * limit
  const to = from + limit - 1
  
  // We can only join admins because created_by has an FK to admins. 
  // students and games don't have FK constraints in score_logs.
  const { data: logs, error, count } = await supabase
    .from('score_logs')
    .select(`
      *,
      admins(username)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  if (logs && logs.length > 0) {
    const studentIds = [...new Set(logs.map(l => l.student_id).filter(Boolean))]
    const gameIds = [...new Set(logs.map(l => l.game_id).filter(Boolean))]

    const [{ data: students }, { data: games }] = await Promise.all([
      studentIds.length ? supabase.from('students').select('student_id, username').in('student_id', studentIds) : Promise.resolve({ data: [] }),
      gameIds.length ? supabase.from('games').select('game_id, game_name').in('game_id', gameIds) : Promise.resolve({ data: [] })
    ])

    const studentMap = (students || []).reduce((acc, s) => { acc[s.student_id] = s; return acc }, {})
    const gameMap = (games || []).reduce((acc, g) => { acc[g.game_id] = g; return acc }, {})

    const enrichedLogs = logs.map(log => ({
      ...log,
      students: studentMap[log.student_id] || { username: 'Unknown' },
      games: gameMap[log.game_id] || { game_name: 'Unknown Game' }
    }))

    return { logs: enrichedLogs, count }
  }

  return { logs: [], count }
}

export const fetchAdminLogs = async (adminId, limit = 50) => {
  const { data: logs, error } = await supabase
    .from('score_logs')
    .select('*')
    .eq('created_by', adminId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  if (logs && logs.length > 0) {
    const studentIds = [...new Set(logs.map(l => l.student_id).filter(Boolean))]
    const gameIds = [...new Set(logs.map(l => l.game_id).filter(Boolean))]

    const [{ data: students }, { data: games }] = await Promise.all([
      studentIds.length ? supabase.from('students').select('student_id, username').in('student_id', studentIds) : Promise.resolve({ data: [] }),
      gameIds.length ? supabase.from('games').select('game_id, game_name').in('game_id', gameIds) : Promise.resolve({ data: [] })
    ])

    const studentMap = (students || []).reduce((acc, s) => { acc[s.student_id] = s; return acc }, {})
    const gameMap = (games || []).reduce((acc, g) => { acc[g.game_id] = g; return acc }, {})

    return logs.map(log => ({
      ...log,
      students: studentMap[log.student_id] || { username: 'Unknown' },
      games: gameMap[log.game_id] || { game_name: 'Unknown Game' }
    }))
  }

  return logs || []
}

export const fetchStudentScores = async (studentId) => {
  const { data, error } = await supabase
    .from('scores')
    .select('*, games(game_name)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const fetchLeaderboard = async () => {
  const { data, error } = await supabase
    .from('students')
    .select('student_id, username, college, total_points')
    .order('total_points', { ascending: false })
    .limit(100) // Realistic cap
  if (error) throw error
  return data
}

// Edge Functions
export const addScoreAPI = async ({ student_id, game_id, points, admin_id }) => {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/addScore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ student_id, game_id, points, admin_id })
  })
  if (!res.ok) throw new Error('Edge Function error')
  const data = await res.json()
  if (!data?.success) throw new Error(data?.error || 'Failed to add score')
  return data
}

export const undoScoreAPI = async ({ score_id, admin_id }) => {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/undoScore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ score_id, admin_id })
  })
  if (!res.ok) throw new Error('Edge Function error')
  const data = await res.json()
  if (!data?.success) throw new Error(data?.error || 'Failed to undo score')
  return data
}

export const editScoreAPI = async ({ score_id, new_points, admin_id }) => {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/editScore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ score_id, new_points, admin_id })
  })
  if (!res.ok) throw new Error('Edge Function error')
  const data = await res.json()
  if (!data?.success) throw new Error(data?.error || 'Failed to edit score')
  return data
}
