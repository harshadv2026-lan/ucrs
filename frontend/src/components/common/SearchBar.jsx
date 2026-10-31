import { Search } from 'lucide-react'

export default function SearchBar({ value = '', onChange, placeholder = 'Search...' }) {
  const handleChange = (e) => {
    if (!onChange) return
    const val = e.target.value
    // Create an enhanced String wrapper that also provides a .target property
    // so both `onChange(val)` and `onChange(e => e.target.value)` work seamlessly.
    const hybrid = new String(val)
    hybrid.target = { value: val }
    hybrid.value = val
    onChange(hybrid)
  }

  return (
    <div className="search-bar">
      <Search size={15} />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </div>
  )
}
