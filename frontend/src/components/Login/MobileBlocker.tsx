import './LoginPage.css'; // Reuse existing styles

export function MobileBlocker() {
    return (
        <>
            <p className="mobile-blocker__bold-text">
                שימו לב
            </p>
            <p className="mobile-blocker__text">
                האתר אינו מותאם לגלישה מהטלפון
                <br />
                התחברו מהמחשב כדי להמשיך
            </p>
        </>
    );
}