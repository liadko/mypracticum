import { useRef, useState } from 'react'
import SignaturePad from 'react-signature-canvas'
import './SignatureModal.css'

interface SignatureModalProps {
  onSave: (sig: string) => Promise<void>
}

export default function SignatureModal({
  onSave,
}: SignatureModalProps) {
  const sigPadRef = useRef<SignaturePad>(null)
  const [isSigned, setIsSigned] = useState(false)


  const handleEnd = () => setIsSigned(true)
  const handleClear = () => {
    sigPadRef.current?.clear()
    setIsSigned(false)
  }

  const handleSave = () => {
    const pad = sigPadRef?.current?.getSignaturePad();
    if (!pad) return


    // 1) get a JPEG Data-URL at 75% quality
    const dataUrl = pad.toDataURL('image/jpeg', 0.75)

    console.log(dataUrl)

    const [, base64] = dataUrl.split(',', 2)

    // 2) fire off the base64 string in your JSON API call
    onSave(base64)
      .catch(console.error)
  }

  return (
    <div className="signature-modal__overlay">
      <div className="signature-modal__content">
        <h2 className="signature-modal__header">
          צרפו את החתימה שלכם
        </h2>

        <p className="signature-modal__text">
          .האתר מיועד לדיווח על שעות הדרכה מעשית
          <br />
          בחתימתכם אתם מאשרים כי כל הדיווחים שיתבצעו באתר הם נכונים ומדויקים
        </p>
        <div className="signature-modal__canvas-container">
          {isSigned && <img
            className="signature-modal__trash"
            src="/trash.png"
            onClick={handleClear}
          >
          </img>}
          <SignaturePad
            ref={sigPadRef}
            backgroundColor='#FCFCFC'
            canvasProps={{
              width: 300,
              height: 150,
              className: 'signature-modal__canvas',

            }}
            onEnd={handleEnd}
          />
        </div>
        <div className="signature-modal__actions">

          <button
            className={`signature-modal__btn signature-modal__btn--primary${!isSigned ? ' signature-modal__btn--disabled' : ''
              }`}
            onClick={handleSave}
            disabled={!isSigned}
          >
            שמור חתימה
          </button>
        </div>
      </div>
    </div>
  )
}