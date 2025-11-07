import { useEntries } from '../context/EntriesContext'
import { useContacts } from '../context/ContactsContext'
import './DesktopApp.css'
import { useAuth } from '../context/AuthContext'
import SignatureModal from '../components/Profile/SignatureModal'
import StudentLayout from './StudentSide/StudentLayout'
import MentorLayout from './MentorSide/MentorLayout'
import { useState } from 'react'
import ProfileModal from '../components/Profile/ProfileModal'


interface DesktopLayoutProps {
    layoutType: string
}

export default function DesktopLayout({ layoutType }: DesktopLayoutProps) {
    const { loadingE, errorE } = useEntries()
    const { loadingC, errorC } = useContacts()

    const { updateSignature, user } = useAuth()

    const [showProfile, setShowProfile] = useState(false)



    if (loadingE || loadingC) return <div>Loading your personal hours…</div>
    if (errorE || errorC) return <div>Oops, something went wrong: {errorE?.message ?? ""} Or {errorC?.message ?? ""}</div>

    if (!user) return <div>Not logged in</div>

    return (
        <>
            {!user.signature && <SignatureModal
                onSave={updateSignature}
            />}
            {showProfile && <ProfileModal
                onClose={() => setShowProfile(false)}
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
                        <div className="subsignature">
                            <div className="settings-button" onClick={() => setShowProfile(true)}>
                                <span className='settings-text'>
                                    הגדרות
                                </span>
                                <img src="/settings-cog.svg" alt="הגדרות" className="settings-cog" />
                            </div>
                            <span className="agreement-text">אני מאשר/ת את הדיווחים</span>
                            <img src="/checkbox.svg" alt="אישור" className="agreement-checkbox" />
                        </div>


                    </div>}

                    {/* Title */}
                    <h1>{user.firstName + " " + user.lastName}</h1>

                    {/* Right block */}
                    <div className="header-right">
                        <span className="status">
                            {layoutType == "student" ? "פרקטיקום סטודנטים" : "פרקטיקום מדריכים"}
                        </span>
                        <img src="/logo-text.png" alt="Logo" className="header-logo" />
                    </div>
                </header>

                {/* STUDENT / MENTOR MAIN LAYOUT */}
                <div className='layout'>

                    {layoutType == "student" ?
                        <StudentLayout />
                        : <MentorLayout />}
                </div>

            </div>
        </>
    )
}

