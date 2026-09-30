import { useState } from 'react'
import { login } from '../lib/api.js'

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('student')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
      onLogin()
    } catch (err) {
      setError(err.message)
      console.error('Error de login:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '64px auto', fontFamily: 'Inter, system-ui' }}>
      <h2>BluePrints P4 - Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="usuario"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="contraseña"
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      <p style={{ opacity: 0.7, marginTop: 8 }}>Prueba con student/student123</p>
    </div>
  )
}
