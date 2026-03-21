import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

export default function SearchBar({ onSearch }) {
  const [term, setTerm] = useState('')

  useEffect(() => {
    const delay = setTimeout(() => {
      onSearch(term)
    }, 300)
    return () => clearTimeout(delay)
  }, [term, onSearch])

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search size={18} className="text-[var(--muted)]" />
      </div>
      <input
        type="text"
        className="input-field pl-11 py-3 bg-[var(--surface)] text-lg"
        placeholder="Search username..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
    </div>
  )
}
