import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/montserrat'
import '@fontsource-variable/cormorant-garamond/wght.css'
import '@fontsource-variable/cormorant-garamond/wght-italic.css'
import '../../styles/tokens.css'
import '../../styles/global.css'
import { LanguageProvider } from '../../i18n/LanguageProvider.tsx'
import { ConstructionPage } from './ConstructionPage'
import { constructionCopy } from './content'

const titles = { vi: constructionCopy.vi.documentTitle, en: constructionCopy.en.documentTitle }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider titles={titles}>
      <ConstructionPage />
    </LanguageProvider>
  </StrictMode>,
)
