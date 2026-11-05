import { useEffect, useEffectEvent, useRef, useState, type ChangeEvent, type MouseEvent, type ReactNode } from 'react'
import { PROJECT_TYPES, PROJECT_TYPE_NAMES, imagePosition, imageSrc, type ProjectType } from '../pages/shared/projects/data'
import { api, type AdminProject, type Localized, type ProjectCategory, type ProjectImage } from './api'
import { CATEGORY_NAMES, UNSAVED, siteLink, status } from './shared'

interface ProjectEditorProps {
  project: AdminProject
  error: string
  notice: string
  /** Back to the list (once any changes not saved have been given up). */
  onBack: () => void
  /** Whether there are changes not saved (the browser's Back asks first, as the way back does). */
  onDirty: (dirty: boolean) => void
  /** Saves the project (null: it did not save). */
  onSave: (project: AdminProject) => Promise<AdminProject | null>
  onDelete: () => Promise<void>
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** A field in both languages: Vietnamese first, English under it (left empty, the site shows the Vietnamese). */
function Bilingual({
  label,
  value,
  onChange,
  multiline,
  required,
  max,
}: {
  label: string
  value?: Localized
  onChange: (value: Localized) => void
  multiline?: boolean
  required?: boolean
  max: number
}) {
  const v = value ?? { vi: '', en: '' }
  const input = (lang: 'vi' | 'en') => {
    const props = {
      value: v[lang],
      maxLength: max,
      required: required && lang === 'vi',
      placeholder: lang === 'en' ? 'English (để trống: dùng tiếng Việt)' : '',
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...v, [lang]: e.target.value }),
    }
    return multiline ? <textarea rows={lang === 'vi' ? 5 : 4} {...props} /> : <input {...props} />
  }
  return (
    <div className="ad-field">
      <span>
        {label}
        {required && ' *'}
      </span>
      <div className="ad-bilingual">
        <label>
          <small>VI</small>
          {input('vi')}
        </label>
        <label>
          <small>EN</small>
          {input('en')}
        </label>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ad-card">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

/** The cover, with the point its square on the site centres on (a tap moves it). */
function CoverField({ cover, onFocus }: { cover: ProjectImage; onFocus: (focus: [number, number]) => void }) {
  const [x, y] = cover.focus ?? [0.5, 0.5]
  const pick = (e: MouseEvent<HTMLImageElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const clamp = (v: number) => Math.min(1, Math.max(0, Math.round(v * 1000) / 1000))
    onFocus([clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height)])
  }
  return (
    <div className="ad-cover">
      <div className="ad-cover__photo">
        <img src={imageSrc(cover)} alt="Ảnh bìa" width={cover.w} height={cover.h} onClick={pick} />
        <i className="ad-cover__dot" style={{ left: `${x * 100}%`, top: `${y * 100}%` }} aria-hidden="true" />
      </div>
      <div className="ad-cover__square">
        <img src={imageSrc(cover)} alt="" style={{ objectPosition: imagePosition({ ...cover, focus: [x, y] }) }} />
        <small>Ô vuông trên website</small>
      </div>
      <p className="ad-help">Chạm vào ảnh để chọn phần ô vuông lấy làm giữa.</p>
    </div>
  )
}

/**
 * One project: what the site says about it, in both languages, its cover and its photos
 * (uploaded from a phone or a computer, in order, with captions). Nothing goes on the site
 * before "Lưu".
 */
export function ProjectEditor({ project, error, notice, onBack, onDirty, onSave, onDelete }: ProjectEditorProps) {
  const [saved, setSaved] = useState(project)
  const [draft, setDraft] = useState(project)
  const [busy, setBusy] = useState(false)
  const [uploads, setUploads] = useState<{ done: number; total: number; failed: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  // (the way back has asked already: leaving the page does not ask again)
  const leaving = useRef(false)
  const dirty = !same(draft, saved)

  // (leaving with changes not saved asks first)
  const tell = useEffectEvent(onDirty)
  useEffect(() => {
    tell(dirty)
    return () => tell(false)
  }, [dirty])
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => {
      if (!leaving.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const set = (change: Partial<AdminProject>) => setDraft((d) => ({ ...d, ...change }))
  const setPhoto = (i: number, change: Partial<ProjectImage>) =>
    setDraft((d) => ({ ...d, photos: d.photos.map((p, k) => (k === i ? { ...p, ...change } : p)) }))
  const movePhoto = (i: number, step: -1 | 1) =>
    setDraft((d) => {
      const photos = [...d.photos]
      ;[photos[i], photos[i + step]] = [photos[i + step], photos[i]]
      return { ...d, photos }
    })

  const back = () => {
    if (dirty && !window.confirm(UNSAVED)) return
    leaving.current = true
    onBack()
  }

  const save = async () => {
    setBusy(true)
    const result = await onSave(draft)
    setBusy(false)
    if (result) {
      setSaved(result)
      setDraft(result)
    }
  }

  /** Photos from the phone or computer, one after another (the server makes the site's sizes). */
  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    const list = Array.from(files)
    const failed: string[] = []
    setUploads({ done: 0, total: list.length, failed })
    for (const [i, file] of list.entries()) {
      try {
        const { photo } = await api.upload(draft.id, file)
        setDraft((d) => ({ ...d, cover: d.cover ?? photo, photos: [...d.photos, photo] }))
      } catch (e) {
        failed.push(`${file.name}: ${e instanceof Error ? e.message : String(e)}`)
      }
      setUploads({ done: i + 1, total: list.length, failed: [...failed] })
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const remove = async () => {
    if (!window.confirm(`Xoá dự án "${saved.title.vi}" và toàn bộ ảnh của nó? Không hoàn tác được.`)) return
    setBusy(true)
    await onDelete()
    setBusy(false)
  }

  const uploading = uploads !== null && uploads.done < uploads.total

  return (
    <div className="ad ad--edit">
      <header className="ad-top">
        <button type="button" className="ad-back" onClick={back} aria-label="Quay lại danh sách dự án">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M14.5 5.5 8 12l6.5 6.5" />
          </svg>
          Quay lại
        </button>
        <p className="ad-top__title">{draft.title.vi || 'Dự án'}</p>
        <span className="ad-chip" data-state={!saved.cover ? 'missing' : saved.hidden ? 'hidden' : 'shown'}>
          {status(saved)}
        </span>
      </header>

      <main className="ad-main">
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

        <Section title="Hiển thị">
          <label className="ad-switch">
            <input type="checkbox" checked={!draft.hidden} onChange={(e) => set({ hidden: !e.target.checked })} />
            <span>Hiện trên website</span>
          </label>
          {!draft.cover && <p className="ad-help">Cần ít nhất một ảnh (ảnh bìa) thì dự án mới hiện trên website.</p>}
          <label className="ad-field">
            <span>Trang</span>
            <select value={draft.category} onChange={(e) => set({ category: e.target.value as ProjectCategory })}>
              {Object.entries(CATEGORY_NAMES).map(([c, name]) => (
                <option key={c} value={c}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="ad-field">
            <span>Loại công trình</span>
            <select value={draft.type ?? ''} onChange={(e) => set({ type: (e.target.value || undefined) as ProjectType | undefined })}>
              <option value="">— Chưa chọn —</option>
              {PROJECT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PROJECT_TYPE_NAMES[type].vi}
                </option>
              ))}
            </select>
          </label>
          <p className="ad-help">Website có bộ lọc theo loại công trình (chỉ hiện những loại có dự án).</p>
          <p className="ad-help">
            Link của dự án:{' '}
            <a href={siteLink(saved)} target="_blank" rel="noopener">
              /{saved.category}/#{saved.id}
            </a>
          </p>
        </Section>

        <Section title="Thông tin">
          <Bilingual label="Tên dự án" value={draft.title} onChange={(title) => set({ title })} required max={140} />
          <Bilingual label="Địa điểm" value={draft.place} onChange={(place) => set({ place })} max={140} />
          <div className="ad-pair">
            <label className="ad-field">
              <span>Năm</span>
              <input value={draft.year ?? ''} maxLength={20} inputMode="numeric" onChange={(e) => set({ year: e.target.value })} />
            </label>
            <label className="ad-field">
              <span>Diện tích</span>
              <input value={draft.area ?? ''} maxLength={40} placeholder="420 m²" onChange={(e) => set({ area: e.target.value })} />
            </label>
          </div>
          <Bilingual label="Hạng mục" value={draft.scope} onChange={(scope) => set({ scope })} max={140} />
          <Bilingual label="Giới thiệu" value={draft.summary} onChange={(summary) => set({ summary })} multiline max={3000} />
        </Section>

        <Section title="Ảnh bìa">
          {draft.cover ? (
            <CoverField cover={draft.cover} onFocus={(focus) => set({ cover: draft.cover && { ...draft.cover, focus } })} />
          ) : (
            <p className="ad-help">Chưa có ảnh bìa — thêm ảnh bên dưới (ảnh đầu tiên thành ảnh bìa), hoặc chọn "Làm ảnh bìa" ở một ảnh.</p>
          )}
        </Section>

        <Section title={`Ảnh dự án (${draft.photos.length})`}>
          <label className="ad-button ad-upload" data-busy={uploading || undefined}>
            <input ref={fileRef} type="file" accept="image/*" multiple disabled={uploading} onChange={(e) => void upload(e.target.files)} />
            {uploading ? `Đang xử lý ảnh ${uploads.done + 1}/${uploads.total}…` : '+ Thêm ảnh'}
          </label>
          {uploads && !uploading && uploads.failed.length === 0 && (
            <p className="ad-help">Đã thêm {uploads.total} ảnh — bấm Lưu để đưa lên website.</p>
          )}
          {uploads?.failed.map((f) => (
            <p key={f} className="ad-error">
              {f}
            </p>
          ))}
          <ol className="ad-photos">
            {draft.photos.map((photo, i) => (
              <li key={photo.base} className="ad-photo">
                <img src={imageSrc(photo)} alt="" width={photo.w} height={photo.h} />
                <div className="ad-photo__body">
                  <Bilingual
                    label={`Chú thích ảnh ${i + 1}`}
                    value={photo.caption}
                    onChange={(caption) => setPhoto(i, { caption })}
                    max={300}
                  />
                  <div className="ad-photo__actions">
                    <button type="button" disabled={i === 0} onClick={() => movePhoto(i, -1)} aria-label="Lên">
                      ↑
                    </button>
                    <button type="button" disabled={i === draft.photos.length - 1} onClick={() => movePhoto(i, 1)} aria-label="Xuống">
                      ↓
                    </button>
                    <button
                      type="button"
                      disabled={draft.cover?.base === photo.base}
                      onClick={() => set({ cover: { base: photo.base, widths: photo.widths, w: photo.w, h: photo.h } })}
                    >
                      {draft.cover?.base === photo.base ? '★ Ảnh bìa' : 'Làm ảnh bìa'}
                    </button>
                    <button
                      type="button"
                      className="ad-danger"
                      onClick={() => setDraft((d) => ({ ...d, photos: d.photos.filter((_, k) => k !== i) }))}
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <button type="button" className="ad-button ad-button--danger" disabled={busy} onClick={remove}>
          Xoá dự án
        </button>
      </main>

      <footer className="ad-bar">
        <span>{dirty ? 'Có thay đổi chưa lưu' : 'Đã lưu'}</span>
        <button type="button" className="ad-button ad-button--quiet" disabled={!dirty || busy} onClick={() => setDraft(saved)}>
          Hoàn tác
        </button>
        <button type="button" className="ad-button" disabled={!dirty || busy || uploading || !draft.title.vi.trim()} onClick={save}>
          {busy ? 'Đang lưu…' : 'Lưu'}
        </button>
      </footer>
    </div>
  )
}
