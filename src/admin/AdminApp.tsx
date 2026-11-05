import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from 'react'
import { PROJECT_TYPES, PROJECT_TYPE_NAMES, imagePosition, imageSrc, type ProjectType } from '../pages/shared/projects/data'
import { ApiError, api, idFor, type AdminProject, type ProjectCategory } from './api'
import { ProjectEditor } from './ProjectEditor'
import { CATEGORY_NAMES, UNSAVED, status } from './shared'

const CATEGORIES = Object.keys(CATEGORY_NAMES) as ProjectCategory[]

type View = { name: 'loading' } | { name: 'login'; passwordSet: boolean } | { name: 'list' } | { name: 'edit'; id: string }

/*
 * A project open is an entry of the browser's history (#its-id): the phone's Back, or the
 * browser's, comes back to the list (asking first if changes are not saved), and a reload stays on it.
 */
const LIST_URL = () => location.pathname + location.search
/** The project an entry of the history is on (null: the list). */
const editedIn = (state: unknown) => (state as { adminEdit?: string } | null)?.adminEdit ?? null
/** The project in the address (#its-id), if any. */
const idInAddress = () => {
  try {
    return decodeURIComponent(location.hash.slice(1))
  } catch {
    return ''
  }
}

/**
 * The projects' admin (/admin/): sign in, the projects of each page in their order — move them,
 * add one, open one to edit it. Every save is on the site at once.
 */
export function AdminApp() {
  const [view, setView] = useState<View>({ name: 'loading' })
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [tab, setTab] = useState<ProjectCategory>('construction')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  // (changes not saved in the project open; the way back has already asked)
  const dirty = useRef(false)
  const asked = useRef(false)

  const fail = (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) {
      setView({ name: 'login', passwordSet: true })
      setError(e.message)
      return
    }
    setError(e instanceof Error ? e.message : String(e))
  }

  const load = async () => {
    const { projects } = await api.projects()
    setProjects(projects)
    // (a reload, or signing in again, on a project: that project, the list a Back away)
    const id = idInAddress()
    if (id && projects.some((p) => p.id === id)) {
      if (editedIn(history.state) !== id) {
        history.replaceState(null, '', LIST_URL())
        history.pushState({ adminEdit: id }, '', `#${encodeURIComponent(id)}`)
      }
      setView({ name: 'edit', id })
      return
    }
    if (location.hash || editedIn(history.state)) history.replaceState(null, '', LIST_URL())
    setView({ name: 'list' })
  }

  /** Opens a project, as an entry of the history. */
  const open = (id: string) => {
    history.pushState({ adminEdit: id }, '', `#${encodeURIComponent(id)}`)
    setError('')
    setView({ name: 'edit', id })
  }

  /** Back to the list (any changes not saved already given up): the history's own way back. */
  const toList = () => {
    setError('')
    if (editedIn(history.state)) {
      asked.current = true
      history.back()
      return
    }
    history.replaceState(null, '', LIST_URL())
    setView({ name: 'list' })
  }

  // The browser's Back / Forward between the list and a project.
  const onHistory = useEffectEvent((state: unknown) => {
    if (view.name !== 'list' && view.name !== 'edit') return
    const id = editedIn(state)
    const sure = asked.current
    asked.current = false
    if (view.name === 'edit' && id !== view.id && dirty.current && !sure && !window.confirm(UNSAVED)) {
      // (stays: the project's entry back on top)
      history.pushState({ adminEdit: view.id }, '', `#${encodeURIComponent(view.id)}`)
      return
    }
    setError('')
    setView(id && projects.some((p) => p.id === id) ? { name: 'edit', id } : { name: 'list' })
  })
  useEffect(() => {
    const pop = (e: PopStateEvent) => onHistory(e.state)
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])

  useEffect(() => {
    let live = true
    api
      .session()
      .then((s) => {
        if (!live) return
        if (s.signedIn) return load()
        setView({ name: 'login', passwordSet: s.passwordSet })
      })
      .catch((e) => live && fail(e))
    return () => {
      live = false
    }
  }, [])

  // A short "saved" note.
  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(''), 3200)
    return () => window.clearTimeout(id)
  }, [notice])

  const save = async (next: AdminProject[], message: string) => {
    setError('')
    const { projects: saved } = await api.save(next)
    setProjects(saved)
    setNotice(message)
    return saved
  }

  if (view.name === 'loading') {
    return error ? (
      <main className="ad-wait">
        <p className="ad-error" role="alert">
          {error}
        </p>
      </main>
    ) : (
      <p className="ad-wait">Đang tải…</p>
    )
  }

  if (view.name === 'login') {
    return (
      <Login
        passwordSet={view.passwordSet}
        error={error}
        onSignIn={async (password) => {
          setError('')
          try {
            await api.login(password)
            await load()
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e))
          }
        }}
      />
    )
  }

  const signOut = async () => {
    await api.logout().catch(() => undefined)
    setProjects([])
    setView({ name: 'login', passwordSet: true })
  }

  if (view.name === 'edit') {
    const project = projects.find((p) => p.id === view.id)
    if (project) {
      return (
        <ProjectEditor
          key={project.id}
          project={project}
          error={error}
          notice={notice}
          onBack={toList}
          onDirty={(d) => {
            dirty.current = d
          }}
          onSave={async (edited) => {
            try {
              const next = projects.map((p) => (p.id === edited.id ? edited : p))
              const saved = await save(
                next,
                edited.hidden || !edited.cover ? 'Đã lưu (chưa hiện trên website).' : 'Đã lưu — website đã cập nhật.',
              )
              return saved.find((p) => p.id === edited.id) ?? edited
            } catch (e) {
              fail(e)
              return null
            }
          }}
          onDelete={async () => {
            try {
              await save(
                projects.filter((p) => p.id !== project.id),
                `Đã xoá "${project.title.vi}".`,
              )
              dirty.current = false
              toList()
            } catch (e) {
              fail(e)
            }
          }}
        />
      )
    }
  }

  const shown = projects.filter((p) => p.category === tab)

  /** Moves a project before / after its neighbour on the same page. */
  const move = async (id: string, step: -1 | 1) => {
    const others = shown.map((p) => p.id)
    const at = others.indexOf(id)
    const swap = others[at + step]
    if (swap === undefined) return
    const next = [...projects]
    const a = next.findIndex((p) => p.id === id)
    const b = next.findIndex((p) => p.id === swap)
    ;[next[a], next[b]] = [next[b], next[a]]
    setProjects(next)
    try {
      await save(next, 'Đã đổi thứ tự.')
    } catch (e) {
      fail(e)
    }
  }

  const add = async (name: string, category: ProjectCategory, type?: ProjectType) => {
    const id = idFor(name, new Set(projects.map((p) => p.id)))
    const fresh: AdminProject = {
      id,
      category,
      ...(type ? { type } : {}),
      hidden: true,
      title: { vi: name, en: '' },
      cover: null,
      photos: [],
    }
    // (first on its page: the newest projects lead)
    const at = projects.findIndex((p) => p.category === category)
    const next = at < 0 ? [...projects, fresh] : [...projects.slice(0, at), fresh, ...projects.slice(at)]
    try {
      await save(next, 'Đã tạo dự án — thêm ảnh và thông tin rồi bấm Lưu.')
      open(id)
    } catch (e) {
      fail(e)
    }
  }

  return (
    <div className="ad">
      <header className="ad-top">
        <p className="ad-brand">
          VILLA NEST <span>Dự án</span>
        </p>
        <a className="ad-link" href="../" target="_blank" rel="noopener">
          Xem website ↗
        </a>
        <button type="button" className="ad-link" onClick={signOut}>
          Đăng xuất
        </button>
      </header>

      <main className="ad-main">
        <nav className="ad-tabs" aria-label="Trang">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" aria-current={tab === c || undefined} onClick={() => setTab(c)}>
              {CATEGORY_NAMES[c]} <small>{projects.filter((p) => p.category === c).length}</small>
            </button>
          ))}
        </nav>

        {error && (
          <p className="ad-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="ad-notice" role="status">
            {notice}
          </p>
        )}

        <AddProject category={tab} onAdd={add} />

        <ol className="ad-list">
          {shown.map((p, i) => (
            <li key={p.id} className="ad-row" data-hidden={p.hidden || !p.cover || undefined}>
              <span className="ad-row__thumb">
                {p.cover && <img src={imageSrc(p.cover)} alt="" style={{ objectPosition: imagePosition(p.cover) }} />}
              </span>
              <button type="button" className="ad-row__main" onClick={() => open(p.id)}>
                <b>{p.title.vi}</b>
                <small>{[p.type && PROJECT_TYPE_NAMES[p.type].vi, p.place?.vi, p.year].filter(Boolean).join(' · ') || '—'}</small>
                <span className="ad-chip" data-state={!p.cover ? 'missing' : p.hidden ? 'hidden' : 'shown'}>
                  {status(p)}
                  {p.sample ? ' · mẫu' : ''}
                </span>
              </button>
              <span className="ad-row__order">
                <button type="button" aria-label={`Đưa "${p.title.vi}" lên`} disabled={i === 0} onClick={() => move(p.id, -1)}>
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Đưa "${p.title.vi}" xuống`}
                  disabled={i === shown.length - 1}
                  onClick={() => move(p.id, 1)}
                >
                  ↓
                </button>
              </span>
            </li>
          ))}
        </ol>
        {!shown.length && <p className="ad-empty">Chưa có dự án nào ở trang {CATEGORY_NAMES[tab]}.</p>}
        <p className="ad-help">Thứ tự ở đây là thứ tự trên website. Bấm vào một dự án để sửa thông tin và ảnh.</p>
      </main>
    </div>
  )
}

function Login({ passwordSet, error, onSignIn }: { passwordSet: boolean; error: string; onSignIn: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    await onSignIn(password)
    setBusy(false)
  }
  return (
    <main className="ad-login">
      <form onSubmit={submit}>
        <p className="ad-brand">
          VILLA NEST <span>Quản trị dự án</span>
        </p>
        {passwordSet ? (
          <>
            <label className="ad-field">
              <span>Mật khẩu</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
            </label>
            <button type="submit" className="ad-button" disabled={busy || !password}>
              {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </>
        ) : (
          <p className="ad-help">
            Chưa đặt mật khẩu. Trên Raspberry Pi, trong thư mục website, chạy: <code>npm run admin:password</code>
          </p>
        )}
        {error && (
          <p className="ad-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </main>
  )
}

function AddProject({
  category,
  onAdd,
}: {
  category: ProjectCategory
  onAdd: (name: string, category: ProjectCategory, type?: ProjectType) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [page, setPage] = useState<ProjectCategory>(category)
  const [type, setType] = useState<ProjectType | ''>('')
  const [busy, setBusy] = useState(false)
  if (!open) {
    return (
      <button
        type="button"
        className="ad-button ad-add"
        onClick={() => {
          setPage(category)
          setOpen(true)
        }}
      >
        + Thêm dự án
      </button>
    )
  }
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    await onAdd(name.trim(), page, type || undefined)
    setBusy(false)
  }
  return (
    <form className="ad-card ad-new" onSubmit={submit}>
      <label className="ad-field">
        <span>Tên dự án</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Biệt thự Thảo Điền"
          autoFocus
          required
          maxLength={140}
        />
      </label>
      <fieldset className="ad-choice">
        <legend>Trang</legend>
        {CATEGORIES.map((c) => (
          <label key={c}>
            <input type="radio" name="page" checked={page === c} onChange={() => setPage(c)} /> {CATEGORY_NAMES[c]}
          </label>
        ))}
      </fieldset>
      <label className="ad-field">
        <span>Loại công trình</span>
        <select value={type} onChange={(e) => setType(e.target.value as ProjectType | '')}>
          <option value="">— Chưa chọn —</option>
          {PROJECT_TYPES.map((t) => (
            <option key={t} value={t}>
              {PROJECT_TYPE_NAMES[t].vi}
            </option>
          ))}
        </select>
      </label>
      <div className="ad-actions">
        <button type="button" className="ad-button ad-button--quiet" onClick={() => setOpen(false)}>
          Huỷ
        </button>
        <button type="submit" className="ad-button" disabled={busy || !name.trim()}>
          {busy ? 'Đang tạo…' : 'Tạo dự án'}
        </button>
      </div>
      <p className="ad-help">Dự án mới được ẩn cho đến khi có ảnh bìa và bạn bật "Hiện trên website".</p>
    </form>
  )
}
