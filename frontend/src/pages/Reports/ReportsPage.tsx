import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from './dashboard/components/Header'
import { StudentSearch } from './dashboard/components/StudentSearch'
import { StudentDetails } from './dashboard/components/StudentDetails'
import { MentorSearch } from './dashboard/components/MentorSearch'
import { MentorDetails } from './dashboard/components/MentorDetails'
import './reports.css'

type Tab = 'students' | 'mentors'
type View = 'list' | 'details'

function readState() {
  const params = new URLSearchParams(window.location.search)
  const studentId = params.get('studentId')
  const mentorId = params.get('mentorId')
  return {
    tab: (mentorId || params.get('tab') === 'mentors' ? 'mentors' : 'students') as Tab,
    view: (studentId || mentorId ? 'details' : 'list') as View,
    studentId,
    mentorId,
  }
}

export default function ReportsPage() {
  const navigate = useNavigate()
  const initial = readState()
  const [activeTab, setActiveTab] = useState<Tab>(initial.tab)
  const [view, setView] = useState<View>(initial.view)
  const [studentId, setStudentId] = useState<string | null>(initial.studentId)
  const [mentorId, setMentorId] = useState<string | null>(initial.mentorId)

  useEffect(() => {
    const sync = () => {
      const next = readState()
      setActiveTab(next.tab); setView(next.view); setStudentId(next.studentId); setMentorId(next.mentorId)
    }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const updateUrl = (tab: Tab, nextStudent: string | null, nextMentor: string | null) => {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    nextStudent ? url.searchParams.set('studentId', nextStudent) : url.searchParams.delete('studentId')
    nextMentor ? url.searchParams.set('mentorId', nextMentor) : url.searchParams.delete('mentorId')
    url.searchParams.delete('subTab')
    window.history.pushState({}, '', url)
  }

  const showList = (tab: Tab = activeTab) => {
    setActiveTab(tab); setView('list'); setStudentId(null); setMentorId(null); updateUrl(tab, null, null)
  }
  const selectStudent = (id: string) => {
    setActiveTab('students'); setView('details'); setStudentId(id); setMentorId(null); updateUrl('students', id, null)
  }
  const selectMentor = (id: string) => {
    setActiveTab('mentors'); setView('details'); setMentorId(id); setStudentId(null); updateUrl('mentors', null, id)
  }

  const exitToApplication = () => {
    navigate('/')
  }

  return (
    <div className="reports-root h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans flex flex-col dir-rtl">
      <Header activeTab={activeTab} onTabChange={(tab) => showList(tab as Tab)} currentView={view} onNavigateList={() => showList()} onExit={exitToApplication} />
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTab === 'students' && (view === 'list' || !studentId ? <StudentSearch onSelectStudent={selectStudent} /> : <StudentDetails studentId={studentId} onBack={() => showList('students')} />)}
        {activeTab === 'mentors' && (view === 'list' || !mentorId ? <MentorSearch onSelectMentor={selectMentor} /> : <MentorDetails mentorId={mentorId} onBack={() => showList('mentors')} onSelectStudent={selectStudent} />)}
      </main>
    </div>
  )
}
