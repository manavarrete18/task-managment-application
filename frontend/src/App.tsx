import { useMemo, useState } from 'react'
import type { FormEventHandler } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ClipboardList, LogOut, Pencil, Plus, RefreshCcw, Trash2, X } from 'lucide-react'
import { apiRequest, ApiError } from './api'
import { AuthProvider } from './auth'
import { useAuth } from './useAuth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AuthResponse, Task, TaskListResponse, TaskStatus } from './types'

function AuthPanel () {
  const { login } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => apiRequest<AuthResponse>(`/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify(mode === 'register'
        ? { name, email, password }
        : { email, password })
    }),
    onSuccess: (data) => {
      login(data)
      setError('')
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Unable to authenticate')
    }
  })

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <main className="mx-auto grid min-h-screen w-[min(1120px,calc(100vw-32px))] grid-cols-[minmax(0,1fr)_420px] items-center gap-12 py-12 max-[820px]:grid-cols-1 max-[820px]:gap-7 max-[820px]:py-7">
      <section className="grid gap-5">
        <div className="grid size-14 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
          <ClipboardList size={28} />
        </div>
        <h1 className="max-w-xl text-6xl font-semibold leading-none text-foreground max-[820px]:text-4xl">
          Task Management
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Track assigned tasks, filter by status, and keep work moving with a focused API-backed workflow.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Access your workspace</CardTitle>
          <CardDescription>Use your account to manage assigned tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 inline-grid grid-flow-col gap-1 rounded-lg border bg-muted p-1" aria-label="Authentication mode">
            <Button variant={mode === 'login' ? 'secondary' : 'ghost'} type="button" onClick={() => setMode('login')}>
              Login
            </Button>
            <Button variant={mode === 'register' ? 'secondary' : 'ghost'} type="button" onClick={() => setMode('register')}>
              Sign up
            </Button>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <Label>
                Name
                <Input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
              </Label>
            )}
            <Label>
              Email
              <Input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" />
            </Label>
            <Label>
              Password
              <Input value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} type="password" />
            </Label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? 'Working...' : mode === 'login' ? 'Login' : 'Create account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

function TaskDashboard () {
  const { session, logout } = useAuth()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<TaskStatus | 'all'>('all')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState<TaskStatus>('pending')
  const token = session?.token ?? ''

  const queryKey = useMemo(() => ['tasks', status], [status])
  const tasksQuery = useQuery({
    queryKey,
    queryFn: () => apiRequest<TaskListResponse>(`/tasks?${new URLSearchParams({
      page: '1',
      limit: '20',
      ...(status === 'all' ? {} : { status })
    })}`, {
      token
    }),
    enabled: Boolean(token)
  })

  const createTask = useMutation({
    mutationFn: () => apiRequest<Task>('/tasks', {
      method: 'POST',
      token,
      body: JSON.stringify({
        title,
        description: description || undefined
      })
    }),
    onSuccess: () => {
      setTitle('')
      setDescription('')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  })

  const updateTask = useMutation({
    mutationFn: (input: {
      id: string;
      title?: string;
      description?: string | null;
      status?: TaskStatus;
    }) => apiRequest<Task>(`/tasks/${input.id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        status: input.status
      })
    }),
    onSuccess: () => {
      setEditingTaskId(null)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  })

  const deleteTask = useMutation({
    mutationFn: (taskId: string) => apiRequest<void>(`/tasks/${taskId}`, {
      method: 'DELETE',
      token
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  })

  const handleCreate: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    createTask.mutate()
  }

  function startEditing (task: Task) {
    setEditingTaskId(task.id)
    setEditTitle(task.title)
    setEditDescription(task.description ?? '')
    setEditStatus(task.status)
  }

  function cancelEditing () {
    setEditingTaskId(null)
    setEditTitle('')
    setEditDescription('')
    setEditStatus('pending')
  }

  function handleUpdate (taskId: string): FormEventHandler<HTMLFormElement> {
    return (event) => {
    event.preventDefault()
    updateTask.mutate({
      id: taskId,
      title: editTitle,
      description: editDescription || null,
      status: editStatus
    })
    }
  }

  const tasks = tasksQuery.data?.items ?? []

  return (
    <main className="mx-auto min-h-screen w-[min(1120px,calc(100vw-32px))] py-8">
      <header className="flex items-center justify-between gap-4 border-b pb-6 max-[820px]:items-stretch max-[820px]:flex-col">
        <div>
          <span className="mb-1 block text-sm font-medium uppercase text-muted-foreground">Signed in as {session?.user.role}</span>
          <h1 className="text-3xl font-semibold text-foreground">{session?.user.name}'s tasks</h1>
        </div>
        <Button variant="outline" size="icon" type="button" onClick={logout} aria-label="Log out">
          <LogOut size={20} />
        </Button>
      </header>

      <section className="flex items-center justify-between gap-4 py-5 max-[820px]:items-stretch max-[820px]:flex-col">
        <div className="inline-grid grid-flow-col gap-1 rounded-lg border bg-muted p-1 max-[820px]:grid-cols-3" aria-label="Task status filter">
          <Button variant={status === 'all' ? 'secondary' : 'ghost'} type="button" onClick={() => setStatus('all')}>
            All
          </Button>
          <Button variant={status === 'pending' ? 'secondary' : 'ghost'} type="button" onClick={() => setStatus('pending')}>
            Pending
          </Button>
          <Button variant={status === 'completed' ? 'secondary' : 'ghost'} type="button" onClick={() => setStatus('completed')}>
            Completed
          </Button>
        </div>
        <Button variant="outline" size="icon" type="button" onClick={() => tasksQuery.refetch()} aria-label="Refresh tasks">
          <RefreshCcw size={18} />
        </Button>
      </section>

      <section className="grid grid-cols-[360px_minmax(0,1fr)] items-start gap-5 max-[820px]:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>New task</CardTitle>
            <CardDescription>Add a task assigned to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleCreate}>
              <Label>
                Title
                <Input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} />
              </Label>
              <Label>
                Description
                <Textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} rows={4} />
              </Label>
              <Button disabled={createTask.isPending} type="submit">
                <Plus size={18} />
                {createTask.isPending ? 'Creating...' : 'Add task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-3" aria-live="polite">
          {tasksQuery.isLoading && <p className="text-muted-foreground">Loading tasks...</p>}
          {tasksQuery.isError && <p className="text-destructive">Unable to load tasks.</p>}
          {!tasksQuery.isLoading && !tasks.length && <p className="text-muted-foreground">No tasks found.</p>}

          {tasks.map((task) => (
            <Card className="py-4" key={task.id}>
              <CardContent>
                {editingTaskId === task.id ? (
                  <form className="grid gap-4" onSubmit={handleUpdate(task.id)}>
                    <Label>
                      Title
                      <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} required maxLength={160} />
                    </Label>
                    <Label>
                      Description
                      <Textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} maxLength={1000} rows={3} />
                    </Label>
                    <div className="grid gap-2">
                      <span className="text-sm font-medium">Status</span>
                      <div className="inline-grid w-fit grid-flow-col gap-1 rounded-lg border bg-muted p-1">
                        <Button variant={editStatus === 'pending' ? 'secondary' : 'ghost'} type="button" onClick={() => setEditStatus('pending')}>
                          Pending
                        </Button>
                        <Button variant={editStatus === 'completed' ? 'secondary' : 'ghost'} type="button" onClick={() => setEditStatus('completed')}>
                          Completed
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button disabled={updateTask.isPending} type="submit">
                        {updateTask.isPending ? 'Saving...' : 'Save changes'}
                      </Button>
                      <Button variant="outline" type="button" onClick={cancelEditing}>
                        <X size={18} />
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between gap-4 max-[820px]:flex-col">
                    <div>
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>{task.status}</Badge>
                      <h2 className="mt-2 text-xl font-semibold text-foreground">{task.title}</h2>
                      {task.description && <p className="mt-1 text-muted-foreground">{task.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={() => updateTask.mutate({
                          id: task.id,
                          status: task.status === 'completed' ? 'pending' : 'completed'
                        })}
                        aria-label="Toggle task status"
                      >
                        <CheckCircle2 size={18} />
                      </Button>
                      <Button variant="outline" size="icon" type="button" onClick={() => startEditing(task)} aria-label="Edit task">
                        <Pencil size={18} />
                      </Button>
                      <Button variant="destructive" size="icon" type="button" onClick={() => deleteTask.mutate(task.id)} aria-label="Delete task">
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      </section>
    </main>
  )
}

function AppContent () {
  const { session } = useAuth()

  return session ? <TaskDashboard /> : <AuthPanel />
}

function App () {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
