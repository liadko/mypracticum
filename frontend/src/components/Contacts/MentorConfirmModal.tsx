import type { NewContact } from '../../types';
import './MentorConfirmModal.css'; // <-- Using its own dedicated CSS file

type Props = {
    mentor: NewContact;
    onClose: () => void;
    onConfirm: () => void;
};

export function MentorConfirmModal({ mentor, onClose, onConfirm }: Props) {
    return (
        // Overlay for the modal
        <div className="mentor-confirm__overlay" onClick={onClose}>
            {/* The modal content itself */}
            <div
                className="mentor-confirm__content"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
            >
                {/* The text content, matching the image */}
                <h2 className="mentor-confirm__title">
                    ודאו שהשם והמייל שהזנתם מדויקים
                </h2>

                {/* New Key-Value Details Section */}
                <div className="mentor-confirm__details">
                    <div className="mentor-confirm__field">
                        <span className="mentor-confirm__label">שם המדריך/ה</span>
                        <span className="mentor-confirm__value">{mentor.name}</span>
                    </div>
                    <div className="mentor-confirm__field">
                        <span className="mentor-confirm__label">מייל</span>
                        <span className="mentor-confirm__value">{mentor.email!}</span>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="mentor-confirm__actions">
                    <button
                        className="mentor-confirm__btn mentor-confirm__btn--ghost"
                        onClick={onClose}
                    >
                        חזרה
                    </button>
                    <button
                        className="mentor-confirm__btn mentor-confirm__btn--primary"
                        onClick={onConfirm}
                    >
                        הוספת המדריך/ה
                    </button>
                </div>
            </div>
        </div>
    );
}