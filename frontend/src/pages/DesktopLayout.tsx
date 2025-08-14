import { useEntries } from '../context/EntriesContext'
import { useContacts } from '../context/ContactsContext'
import './DesktopApp.css'
import { type User } from '../types'
import { useAuth } from '../context/AuthContext'
import SignatureModal from '../components/WelcomeModal/SignatureModal'
import StudentLayout from './StudentSide/StudentLayout'
import MentorLayout from './MentorSide/MentorLayout'


interface DesktopLayoutProps {
    user: User
    layoutType: string
}

export default function DesktopLayout({ user, layoutType }: DesktopLayoutProps) {
    const { loadingE, errorE } = useEntries()
    const { loadingC, errorC } = useContacts()

    const { updateSignature } = useAuth()




    if (loadingE || loadingC) return <div>Loading your personal hours…</div>
    if (errorE || errorC) return <div>Oops, something went wrong: {errorE?.message ?? ""} Or {errorC?.message ?? ""}</div>

    return (
        <>
            {!user.signature && <SignatureModal
                onSave={updateSignature}
            />}
            <div className="desktop-app">
                {/* HEADER */}
                <header className="header">
                    {/* Left block */}
                    {user.signature && <div className="header-left">
                        <img
                            src={`data:image/jpeg;base64,${user.signature}`}
                            alt="חתימתך"
                            className="signature-image" />
                        <label className="agreement">
                            <span className="agreement-text">אני מאשר/ת את כל הדיווחים</span>
                            <img src="/checkbox.svg" alt="אישור" className="agreement-checkbox" />
                        </label>
                    </div>}

                    {/* Title */}
                    <h1>{user.firstName + " " + user.lastName}</h1>

                    {/* Right block */}
                    <div className="header-right">
                        <span className="status">
                            {false ? '...שומר שינויים' : 'כל השינויים שמורים'}
                        </span>
                        <img src="/logo-text.png" alt="Logo" className="header-logo" />
                    </div>
                </header>

                {/* STUDENT / MENTOR MAIN LAYOUT */}
                {layoutType == "student" ?
                    <StudentLayout />
                    : <MentorLayout />}

            </div>
        </>
    )
}

