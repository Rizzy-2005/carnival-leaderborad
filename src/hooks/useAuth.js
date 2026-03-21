import { useState, useEffect } from 'react'

export const useAuth = () => {
  const [student, setStudent] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from local storage on mount
    const storedStudent = localStorage.getItem('carnival_student')
    const storedAdmin = localStorage.getItem('carnival_admin')

    if (storedStudent) {
      try {
        setStudent(JSON.parse(storedStudent))
      } catch (e) {
        localStorage.removeItem('carnival_student')
      }
    }
    
    if (storedAdmin) {
      try {
        setAdmin(JSON.parse(storedAdmin))
      } catch (e) {
        localStorage.removeItem('carnival_admin')
      }
    }
    
    setLoading(false)
  }, [])

  const loginStudentSession = (studentData) => {
    localStorage.setItem('carnival_student', JSON.stringify(studentData))
    setStudent(studentData)
  }

  const loginAdminSession = (adminData) => {
    localStorage.setItem('carnival_admin', JSON.stringify(adminData))
    setAdmin(adminData)
  }

  const logoutStudent = () => {
    localStorage.removeItem('carnival_student')
    setStudent(null)
  }

  const logoutAdmin = () => {
    localStorage.removeItem('carnival_admin')
    setAdmin(null)
  }

  return { student, admin, loginStudentSession, loginAdminSession, logoutStudent, logoutAdmin, loading }
}
