import { useState, useEffect } from 'react'
import Portfolio from './portfolio'
import Impressum from './pages/Impressum'
import Datenschutz from './pages/Datenschutz'

function getPage() {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'impressum') return 'impressum'
  if (hash === 'datenschutz') return 'datenschutz'
  return 'home'
}

export default function App() {
  const [page, setPage] = useState(getPage)

  useEffect(() => {
    const onHash = () => {
      setPage(getPage())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (page === 'impressum') return <Impressum />
  if (page === 'datenschutz') return <Datenschutz />
  return <Portfolio />
}
