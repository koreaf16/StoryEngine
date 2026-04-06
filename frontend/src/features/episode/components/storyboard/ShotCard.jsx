/**
 * @file ShotCard.jsx
 * @description 스토리보드 샷 카드. 스냅 이미지 + 샷 정보 + 대사 미리보기 + 액션 버튼.
 * @usage SceneGroup.jsx 내부에서 각 샷을 렌더링.
 * @connects shared/components/ui/Badge.jsx, shared/constants/colors.js
 * @doc docs/05-episode.md (6. 스토리보드 UI — 전체 보기)
 */
import Badge from '../../../../shared/components/ui/Badge.jsx'
import { TRANSITION_LABELS } from '../../constants/episodeStatus.js'

export default function ShotCard({ shot, assets, onEdit, onDelete, onRegenerate, isRegenerating = false }) {
  const firstDialogue = shot.dialogues?.[0]
  const speakerAsset = firstDialogue ? assets.find((a) => a.asset_id === firstDialogue.speaker_asset) : null

  return (
    <div className="group bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden hover:border-slate-600 transition-colors">
      <div className="flex">
        {/* 드래그 핸들 + 스냅 이미지 영역 */}
        <div className="flex shrink-0">
          <div className="w-6 flex items-center justify-center text-slate-600 cursor-grab hover:text-slate-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
              <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
              <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
            </svg>
          </div>
          <div className="w-44 h-28 bg-slate-900/50 flex items-center justify-center">
            {shot.snap_image ? (
              <img src={shot.snap_image} alt={`Shot ${shot.shot_number}`} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <svg className="w-8 h-8 text-slate-700 mx-auto" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <span className="text-[10px] text-slate-600 mt-1">Snap #{shot.shot_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* 샷 정보 */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 font-mono">#{shot.shot_number}</span>
                <Badge bg="bg-blue-500/20" text="text-blue-400">{shot.camera_motion}</Badge>
                <Badge bg="bg-slate-600/30" text="text-slate-400">{shot.duration_sec}s</Badge>
                <Badge bg="bg-slate-600/30" text="text-slate-400">{TRANSITION_LABELS[shot.transition] || shot.transition}</Badge>
              </div>
              <p className="text-sm text-slate-300 mt-1.5 line-clamp-2">{shot.render_prompt}</p>
              {shot.video_prompt && (
                <p className="text-xs text-purple-400 mt-1 line-clamp-1">
                  <span className="font-mono text-[10px] text-purple-500 mr-1">VIDEO</span>
                  {shot.video_prompt}
                </p>
              )}
            </div>
          </div>

          {/* 대사 미리보기 */}
          {firstDialogue && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-teal-400 font-medium">{speakerAsset?.display_name || firstDialogue.speaker_asset}</span>
              <span className="text-slate-500 truncate">"{firstDialogue.text}"</span>
              {shot.dialogues.length > 1 && (
                <span className="text-slate-600 shrink-0">+{shot.dialogues.length - 1}</span>
              )}
            </div>
          )}

          {/* 오디오 태그 */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {shot.bgm_mood && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303" />
                </svg>
                {shot.bgm_mood}
              </span>
            )}
            {shot.sfx?.length > 0 && (
              <span className="text-[10px] text-slate-600">{shot.sfx.join(', ')}</span>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-1 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(shot)} className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors" title="수정">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </button>
          <button
            onClick={() => !isRegenerating && onRegenerate(shot)}
            disabled={isRegenerating}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="스냅 재생성"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`}
              fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </button>
          <button onClick={() => onDelete(shot)} className="p-1.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors" title="삭제">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
