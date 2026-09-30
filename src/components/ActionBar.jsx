import { useState } from 'react'

export default function ActionBar({
  tech,
  onTechChange,
  hasChanges,
  onSave,
  onDelete,
  onCreate,
  onLogout,
  saving,
  message,
}) {
  const [newName, setNewName] = useState('')

  function handleCreate() {
    if (!newName.trim()) return
    onCreate(newName.trim())
    setNewName('')
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <label htmlFor="tech">Tecnología:</label>
      <select id="tech" value={tech} onChange={(event) => onTechChange(event.target.value)}>
        <option value="none">None</option>
        <option value="socketio">Socket.IO (Node)</option>
        <option value="stomp">STOMP (Spring)</option>
      </select>

      <input
        value={newName}
        onChange={(event) => setNewName(event.target.value)}
        placeholder="nombre del plano"
      />
      <button onClick={handleCreate} disabled={!newName.trim()}>
        Create
      </button>
      <button onClick={onSave} disabled={!hasChanges || saving}>
        {saving ? 'Guardando...' : 'Save/Update'}
      </button>
      <button onClick={onDelete}>Delete</button>
      <button onClick={onLogout}>Salir</button>
      {message && <span style={{ opacity: 0.8 }}>{message}</span>}
    </div>
  )
}
