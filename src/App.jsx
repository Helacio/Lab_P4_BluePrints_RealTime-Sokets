import { useEffect, useRef, useState } from 'react'
import { createSocket } from './lib/socketIoClient.js'
import { createStompClient, subscribeBlueprint } from './lib/stompClient.js'
import * as api from './lib/api.js'
import LoginForm from './components/LoginForm.jsx'
import AuthorPanel from './components/AuthorPanel.jsx'
import ActionBar from './components/ActionBar.jsx'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080'
const IO_BASE = import.meta.env.VITE_IO_BASE ?? 'http://localhost:3001'

export default function App() {
  const [authenticated, setAuthenticated] = useState(api.isAuthenticated())
  const [tech, setTech] = useState('socketio')
  const [author, setAuthor] = useState('john')
  const [name, setName] = useState('house')
  const [points, setPoints] = useState([])
  const [savedCount, setSavedCount] = useState(0)
  const [blueprints, setBlueprints] = useState([])
  const [loadingList, setLoadingList] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [listError, setListError] = useState(null)

  const canvasRef = useRef(null)
  const socketRef = useRef(null)
  const stompRef = useRef(null)
  const unsubRef = useRef(null)

  function handleApiError(err) {
    if (err.status === 401) {
      api.logout()
      setAuthenticated(false)
      return
    }
    setListError(err.message)
  }

  useEffect(() => {
    if (!authenticated) return
    let cancelled = false

    api
      .getBlueprint(author, name)
      .then((blueprint) => {
        if (cancelled) return
        setPoints(blueprint.points ?? [])
        setSavedCount(blueprint.points?.length ?? 0)
        setMessage(null)
      })
      .catch((err) => {
        if (cancelled) return
        handleApiError(err)
      })

    return () => {
      cancelled = true
    }
  }, [authenticated, author, name])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (points.length === 1) {
      ctx.beginPath()
      ctx.arc(points[0].x, points[0].y, 2, 0, Math.PI * 2)
      ctx.fill()
      return
    }

    ctx.beginPath()
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y)
      else ctx.lineTo(point.x, point.y)
    })
    ctx.stroke()
  }, [points])

  useEffect(() => {
    unsubRef.current?.()
    unsubRef.current = null
    stompRef.current?.deactivate?.()
    stompRef.current = null
    socketRef.current?.disconnect?.()
    socketRef.current = null

    if (!authenticated || tech === 'none') return undefined

    if (tech === 'stomp') {
      const client = createStompClient(API_BASE)
      stompRef.current = client
      client.onConnect = () => {
        unsubRef.current = subscribeBlueprint(client, author, name, (update) => {
          setPoints(Array.isArray(update.points) ? update.points : [])
        })
      }
      client.activate()
    } else if (tech === 'socketio') {
      const socket = createSocket(IO_BASE)
      socketRef.current = socket
      const room = `blueprints.${author}.${name}`
      const joinRoom = () => socket.emit('join-room', room)

      socket.on('connect', joinRoom)
      socket.on('blueprint-update', (update) => {
        if (update.author !== author || update.name !== name) return
        if (!Number.isFinite(update.point?.x) || !Number.isFinite(update.point?.y)) return
        setPoints((current) => [...current, update.point])
      })

      if (socket.connected) joinRoom()
    }

    return () => {
      unsubRef.current?.()
      unsubRef.current = null
      stompRef.current?.deactivate?.()
      stompRef.current = null
      socketRef.current?.disconnect?.()
      socketRef.current = null
    }
  }, [authenticated, tech, author, name])

  function refreshBlueprints() {
    setLoadingList(true)
    setListError(null)
    api
      .getBlueprintsByAuthor(author)
      .then((list) => setBlueprints(Array.isArray(list) ? list : []))
      .catch(handleApiError)
      .finally(() => setLoadingList(false))
  }

  function selectBlueprint(blueprint) {
    setAuthor(blueprint.author)
    setName(blueprint.name)
  }

  async function createBlueprint(newName) {
    try {
      const created = await api.createBlueprint({ author, name: newName, points: [] })
      setBlueprints((current) => [...current, created])
      setAuthor(created.author)
      setName(created.name)
      setPoints(created.points ?? [])
      setSavedCount(created.points?.length ?? 0)
      setMessage(`Plano "${newName}" creado`)
    } catch (err) {
      handleApiError(err)
    }
  }

  async function saveBlueprint() {
    const pending = points.slice(savedCount)
    if (pending.length === 0) return

    setSaving(true)
    try {
      for (const point of pending) {
        await api.addPoint(author, name, point)
      }
      setSavedCount((count) => count + pending.length)
      setMessage(`Plano guardado (${pending.length} punto(s) nuevos)`)
      refreshBlueprints()
    } catch (err) {
      handleApiError(err)
    } finally {
      setSaving(false)
    }
  }

  async function deleteBlueprint() {
    try {
      await api.deleteBlueprint(author, name)
      setBlueprints((current) =>
        current.filter((bp) => !(bp.author === author && bp.name === name)),
      )
      setPoints([])
      setSavedCount(0)
      setMessage(`Plano "${name}" eliminado`)
    } catch (err) {
      handleApiError(err)
    }
  }

  function logout() {
    api.logout()
    setAuthenticated(false)
  }

  function onClick(event) {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    const point = {
      x: Math.round(event.clientX - rect.left),
      y: Math.round(event.clientY - rect.top),
    }

    setPoints((current) => [...current, point])

    if (tech === 'socketio' && socketRef.current?.connected) {
      const room = `blueprints.${author}.${name}`
      socketRef.current.emit('draw-event', { room, author, name, point })
    } else if (tech === 'stomp' && stompRef.current?.connected) {
      stompRef.current.publish({
        destination: '/app/draw',
        body: JSON.stringify({ author, name, point }),
      })
    }
  }

  if (!authenticated) {
    return <LoginForm onLogin={() => setAuthenticated(true)} />
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui', padding: 16, maxWidth: 900 }}>
      <h2>BluePrints RT</h2>
      <ActionBar
        tech={tech}
        onTechChange={setTech}
        hasChanges={points.length > savedCount}
        saving={saving}
        message={message}
        onSave={saveBlueprint}
        onDelete={deleteBlueprint}
        onCreate={createBlueprint}
        onLogout={logout}
      />
      <AuthorPanel
        author={author}
        onAuthorChange={setAuthor}
        blueprints={blueprints}
        loading={loadingList}
        error={listError}
        onSelect={selectBlueprint}
        onRefresh={refreshBlueprints}
      />
      <p style={{ margin: '8px 0' }}>
        Plano actual: {author}/{name} — {points.length} punto(s)
      </p>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{ border: '1px solid #ddd', borderRadius: 12 }}
        onClick={onClick}
      />
      <p style={{ opacity: 0.7, marginTop: 8 }}>
        Dibuja con clics; usa Save/Update para persistir los puntos nuevos y abre dos pestañas para
        probar la colaboración con Socket.IO.
      </p>
    </div>
  )
}
