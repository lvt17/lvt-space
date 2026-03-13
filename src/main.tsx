import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

console.log('[main.tsx] Starting React app...')

try {
    const root = document.getElementById('root')
    console.log('[main.tsx] Root element:', root)
    if (root) {
        createRoot(root).render(
            <StrictMode>
                <App />
            </StrictMode>,
        )
        console.log('[main.tsx] React render called successfully')
    } else {
        console.error('[main.tsx] Root element not found!')
    }
} catch (err) {
    console.error('[main.tsx] FATAL ERROR:', err)
    document.body.innerHTML = `<pre style="color:red;padding:20px;">REACT CRASH: ${err}</pre>`
}
