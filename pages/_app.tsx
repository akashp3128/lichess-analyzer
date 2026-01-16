import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  // Lightweight theme toggle state for demo; sync with localStorage if desired
  const [theme, setTheme] = useState<'light'|'dark'>('light')
  useEffect(() => {
    // initialize from system preference if available
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark && theme !== 'dark') setTheme('dark')
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('theme-dark')
    else root.classList.remove('theme-dark')
  }, [theme])

  return (
    <div>
      <header style={{ display:'flex', justifyContent:'flex-end', padding: '8px 16px' }}>
        <button aria-label="Toggle theme" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
          {theme === 'dark' ? 'Light' : 'Dark'} mode
        </button>
      </header>
      <Component {...pageProps} />
    </div>
  )
}
