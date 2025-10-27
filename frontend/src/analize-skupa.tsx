
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import Analysis from './Analysis.tsx'

function AnalizeSkupa(naslov: string) {

    createRoot(document.getElementById('root')!).render(
    <StrictMode>
     <Analysis naslov={naslov} />
    </StrictMode>,
  )
}

export default AnalizeSkupa;