import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/montserrat'
import '@fontsource-variable/cormorant-garamond/wght.css'
import '@fontsource-variable/cormorant-garamond/wght-italic.css'
import '../../styles/tokens.css'
import '../../styles/global.css'
import { LanguageProvider } from '../../i18n/LanguageProvider.tsx'
import { pageCopy } from './content'
import { SmartHomePage } from './SmartHomePage'

const titles = { vi: pageCopy.vi.documentTitle, en: pageCopy.en.documentTitle }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider titles={titles}>
      <SmartHomePage />
    </LanguageProvider>
  </StrictMode>,
)
