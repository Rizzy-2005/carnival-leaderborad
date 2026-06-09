import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

export default function SearchBar({ onSearch }) {
  const [term, setTerm] = useState('')

  useEffect(() => {
    const delay = setTimeout(() => { onSearch(term) }, 300)
    return () => clearTimeout(delay)
  }, [term, onSearch])

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{
        position: 'absolute',
        inset: 'auto auto auto 0',
        top: '50%',
        transform: 'translateY(-50%)',
        left: '1rem',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        color: 'var(--muted)',
      }}>
        <Search size={16} />
      </div>
      <input
        id="leaderboard-search"
        type="text"
        className="input-field"
        placeholder="Search player..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        style={{ paddingLeft: '2.6rem', paddingRight: '1rem' }}
      />
    </div>
  )
}
