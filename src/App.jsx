import { useEffect, useRef, useState } from 'react'
import { createStompClient, subscribeBlueprint } from './lib/stompClient.js'
import { createSocket } from './lib/socketIoClient.js'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080' // Spring
const IO_BASE  = import.meta.env.VITE_IO_BASE  ?? 'http://localhost:3001' // Node/Socket.IO

export default function App() {
  const [tech, setTech] = useState('socketio')
  const [author, setAuthor] = useState('juan')
  const [name, setName] = useState('plano-1')
  const [points, setPoints] = useState([])
  const canvasRef = useRef(null)

  const stompRef = useRef(null)
  const unsubRef = useRef(null)
  const socketRef = useRef(null)

  useEffect(() => {
    fetch(`${tech === 'stomp' ? API_BASE : IO_BASE}/api/blueprints/${author}/${name}`)
      .then((response) => response.json())
      .then((blueprint) => setPoints(blueprint.points ?? []))
      .catch((error) => console.error('No se pudo cargar el plano:', error))
  }, [tech, author, name])

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

    if (tech === 'stomp') {
      const client = createStompClient(API_BASE)
      stompRef.current = client
      client.onConnect = () => {
        unsubRef.current = subscribeBlueprint(client, author, name, (update) => {
          setPoints(update.points ?? [])
        })
      }
      client.activate()
    } else {
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
      socketRef.current?.disconnect?.()
    }
  }, [tech, author, name])

  function onClick(event) {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    const point = {
      x: Math.round(event.clientX - rect.left),
      y: Math.round(event.clientY - rect.top),
    }

    if (tech === 'stomp' && stompRef.current?.connected) {
      stompRef.current.publish({
        destination: '/app/draw',
        body: JSON.stringify({ author, name, point }),
      })
    } else if (tech === 'socketio' && socketRef.current?.connected) {
      const room = `blueprints.${author}.${name}`
      socketRef.current.emit('draw-event', { room, author, name, point })
    }
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui', padding: 16, maxWidth: 900 }}>
      <h2>BluePrints RT – Socket.IO vs STOMP</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <label>Tecnología:</label>
        <select value={tech} onChange={(event) => setTech(event.target.value)}>
          <option value="stomp">STOMP (Spring)</option>
          <option value="socketio">Socket.IO (Node)</option>
        </select>
        <input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="autor" />
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="plano" />
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{ border: '1px solid #ddd', borderRadius: 12 }}
        onClick={onClick}
      />
      <p style={{ opacity: 0.7, marginTop: 8 }}>
        Tip: abre 2 pestañas y dibuja alternando para ver la colaboración.
      </p>
    </div>
  )
}
