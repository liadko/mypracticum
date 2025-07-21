import { useRef, useState } from 'react'
import SignaturePad from 'react-signature-canvas'
import './SignatureModal.css'

interface SignatureModalProps {
  isOpen: boolean
  onSave: (dataUrl: string) => void
  onClose: () => void
}

export default function SignatureModal({
  isOpen,
  onSave,
  onClose,
}: SignatureModalProps) {
  const sigPadRef = useRef<SignaturePad>(null)
  const [isSigned, setIsSigned] = useState(false)

  if (!isOpen) return null

  const handleEnd = () => setIsSigned(true)
  const handleClear = () => {
    sigPadRef.current?.clear()
    setIsSigned(false)
  }
  const handleSave = () => {
    const dataUrl = sigPadRef.current
      ?.getTrimmedCanvas()
      .toDataURL('image/png')
    if (dataUrl) onSave(dataUrl)
  }

  return (
    <div className="signature-modal__overlay">
      <div className="signature-modal__content">
        <button
          className="signature-modal__close-btn"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="signature-modal__header">
          Please provide your signature
        </h2>
        <p className="signature-modal__text">
          To complete your profile, draw your signature in the box
          below. You can clear and redraw as needed.
        </p>
        <div className="signature-modal__canvas-container">
          <SignaturePad
            ref={sigPadRef}
            canvasProps={{
              width: 500,
              height: 200,
              className: 'signature-modal__canvas',
            }}
            onEnd={handleEnd}
          />
        </div>
        <div className="signature-modal__actions">
          <button
            className="signature-modal__btn"
            onClick={handleClear}
          >
            Clear
          </button>
          <button
            className={`signature-modal__btn signature-modal__btn--primary${
              !isSigned ? ' signature-modal__btn--disabled' : ''
            }`}
            onClick={handleSave}
            disabled={!isSigned}
          >
            Save Signature
          </button>
        </div>
      </div>
    </div>
  )
}