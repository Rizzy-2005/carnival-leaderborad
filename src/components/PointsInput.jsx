export default function PointsInput({ value, onChange }) {
  return (
    <div className="flex flex-col gap-4">
      <input 
        type="number" 
        min="1" 
        max="1000" 
        value={value || ''} 
        onChange={(e) => {
          const val = Number(e.target.value)
          if (!isNaN(val)) onChange(val)
        }} 
        className="input-field text-3xl text-center font-bold py-4"
        placeholder="0"
      />
      <div className="flex justify-between gap-2 mt-2">
        {[10, 25, 50, 100].map(pts => (
          <button 
            key={pts} 
            type="button"
            className="btn-secondary flex-1 py-3 text-lg font-bold border-2 hover:bg-[rgba(167,139,250,0.15)]"
            onClick={() => onChange(value + pts)}
          >
            +{pts}
          </button>
        ))}
      </div>
    </div>
  )
}
