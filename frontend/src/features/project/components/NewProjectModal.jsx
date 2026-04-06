/**
 * @file NewProjectModal.jsx
 * @description 새 프로젝트 생성 모달. 제목 + 장르 + 비주얼 스타일 입력 후 생성.
 * @usage ProjectListPage에서 NewProjectCard 클릭 시 열림.
 * @connects shared/components/ui/Modal.jsx, store/useProjectStore.js
 * @doc docs/01-project.md (프로젝트 생성)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../../../shared/components/ui/Modal.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import useProjectStore from '../../../store/useProjectStore.js'
import VisualStyleSelector from './VisualStyleSelector.jsx'

export default function NewProjectModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [visualStyle, setVisualStyle] = useState('PHOTOREALISTIC')
  const navigate = useNavigate()
  const createProject = useProjectStore((s) => s.createProject)

  const handleCreate = async () => {
    if (!title.trim()) return
    const newId = await createProject(title.trim(), genre.trim(), visualStyle)
    onClose()
    setTitle('')
    setGenre('')
    setVisualStyle('PHOTOREALISTIC')
    navigate(`/project/${newId}/seed`)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새 프로젝트">
      <div className="space-y-5">
        <div>
          <label className="block text-sm text-slate-400 mb-1">프로젝트 제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 잿빛 숲의 복수"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">장르</label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="예: 다크 판타지"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">비주얼 스타일</label>
          <VisualStyleSelector value={visualStyle} onChange={setVisualStyle} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button onClick={handleCreate} disabled={!title.trim()}>생성</Button>
        </div>
      </div>
    </Modal>
  )
}
