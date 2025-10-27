
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import Analysis from './Analysis.tsx'

function InfoAnalize() {

    createRoot(document.getElementById('root')!).render(
    <StrictMode>
     <Analysis />
    </StrictMode>,
  )
}

export default InfoAnalize;