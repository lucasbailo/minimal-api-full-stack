import { useEffect, useState, type FormEvent } from 'react'

type Task = { id: number; title: string; done: boolean; createdAt: string }
const API = 'http://localhost:5000/api/tasks'

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    try {
      setLoading(true)
      const res = await fetch(API)
      if (!res.ok) throw new Error('Erro ao carregar tarefas')
      setTasks(await res.json())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function add(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    if (!res.ok) return setError('Erro ao criar tarefa')
    const created: Task = await res.json()
    setTasks(prev => [...prev, created])
    setTitle('')
  }

  async function toggle(id: number) {
    const res = await fetch(`${API}/${id}/toggle`, { method: 'PATCH' })
    if (!res.ok) return
    const updated: Task = await res.json()
    setTasks(prev => prev.map(t => (t.id === id ? updated : t)))
  }

  async function remove(id: number) {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' })
    if (res.ok) setTasks(prev => prev.filter(t => t.id !== id))
  }

  const doneCount = tasks.filter(t => t.done).length

  return (
    <main style={{ maxWidth: 480, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Tarefas</h1>

      <form onSubmit={add}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nova tarefa" />
        <button type="submit">Adicionar</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? <p>Carregando...</p> : (
        <>
          <p>{doneCount} de {tasks.length} concluídas</p>
          <ul>
            {tasks.map(t => (
              <li key={t.id}>
                <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
                <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</span>
                <button onClick={() => remove(t.id)}>🗑</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}
