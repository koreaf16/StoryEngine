/**
 * @file routes.jsx
 * @description 앱 전체 라우트 정의. 페이지 컴포넌트와 URL 경로를 매핑.
 * @usage App.jsx에서 import하여 <Routes> 안에 렌더링.
 * @connects features/project/pages, features/script/pages, features/character/pages,
 *           features/visual/pages, features/episode/pages, ProjectShell
 * @doc docs/10-ui-spec.md (화면 목록)
 */
import { Routes, Route } from 'react-router-dom'
import ProjectListPage from '../features/project/pages/ProjectListPage.jsx'
import ProjectShell from '../shared/components/layout/ProjectShell.jsx'
import SeedInputPage from '../features/script/pages/SeedInputPage.jsx'
import PromptAPage from '../features/script/pages/PromptAPage.jsx'
import PasteResponsePage from '../features/script/pages/PasteResponsePage.jsx'
import PromptBPage from '../features/script/pages/PromptBPage.jsx'
import AssetConfirmPage from '../features/script/pages/AssetConfirmPage.jsx'
import CharacterListPage from '../features/character/pages/CharacterListPage.jsx'
import CharacterPromptPage from '../features/character/pages/CharacterPromptPage.jsx'
import CharacterConfirmPage from '../features/character/pages/CharacterConfirmPage.jsx'
import AssetSelectPage from '../features/visual/pages/AssetSelectPage.jsx'
import AnchorSelectPage from '../features/visual/pages/AnchorSelectPage.jsx'
import DerivedImagesFlowPage from '../features/visual/pages/DerivedImagesFlowPage.jsx'
import LoraGuidePage from '../features/visual/pages/LoraGuidePage.jsx'
import AssetGalleryPage from '../features/visual/pages/AssetGalleryPage.jsx'
import EpisodeListPage from '../features/episode/pages/EpisodeListPage.jsx'
import EpisodeStartPage from '../features/episode/pages/EpisodeStartPage.jsx'
import NovelPage from '../features/episode/pages/NovelPage.jsx'
import ChainDesignPage from '../features/episode/pages/ChainDesignPage.jsx'
import SkeletonPromptPage from '../features/episode/pages/SkeletonPromptPage.jsx'
import StoryboardPage from '../features/episode/pages/StoryboardPage.jsx'
import EpisodeConfirmPage from '../features/episode/pages/EpisodeConfirmPage.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProjectListPage />} />
      <Route path="/project/:id" element={<ProjectShell />}>
        <Route path="seed" element={<SeedInputPage />} />
        <Route path="prompt-a" element={<PromptAPage />} />
        <Route path="paste-a" element={<PasteResponsePage />} />
        <Route path="prompt-b" element={<PromptBPage />} />
        <Route path="assets" element={<AssetConfirmPage />} />
        <Route path="characters" element={<CharacterListPage />} />
        <Route path="characters/:assetId/prompt" element={<CharacterPromptPage />} />
        <Route path="characters/:assetId/confirm" element={<CharacterConfirmPage />} />
        <Route path="visual" element={<AssetSelectPage />} />
        <Route path="visual/:assetId/anchor" element={<AnchorSelectPage />} />
        <Route path="visual/:assetId/derived" element={<DerivedImagesFlowPage />} />
        <Route path="visual/:assetId/lora-guide" element={<LoraGuidePage />} />
        <Route path="visual/:assetId/gallery" element={<AssetGalleryPage />} />
        <Route path="episode" element={<EpisodeListPage />} />
        <Route path="episode/new" element={<EpisodeStartPage />} />
        <Route path="episode/:episodeId/novel" element={<NovelPage />} />
        <Route path="episode/:episodeId/chain-design" element={<ChainDesignPage />} />
        <Route path="episode/:episodeId/skeleton" element={<SkeletonPromptPage />} />
        <Route path="episode/:episodeId/storyboard" element={<StoryboardPage />} />
        <Route path="episode/:episodeId/confirm" element={<EpisodeConfirmPage />} />
      </Route>
    </Routes>
  )
}
