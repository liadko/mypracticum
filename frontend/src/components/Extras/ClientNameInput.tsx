import { useState, useEffect } from 'react';
import './Extras.css'

// Define the props our component will accept
interface ClientNameInputProps {
  id: string;
  // The official, server-confirmed value of the client's name
  value: string;
  // The function to call when an update should be sent to the server
  onUpdate: (newValue: string) => void;
  // A prop to disable the input if the app is in an offline/error state
  disabled?: boolean;
}

export function ClientNameInput({ id, value: serverValue, onUpdate, disabled = false }: ClientNameInputProps) {
  // 1. "Local State": This holds what the user is currently typing.
  // It defaults to the value from the server.
  const [localValue, setLocalValue] = useState(serverValue);

  // This `useEffect` handles the DEBOUNCE logic.
  useEffect(() => {
    // If the user hasn't typed anything different from what's on the server, do nothing.
    if (localValue === serverValue) {
      return;
    }

    // Set a timer. If the user doesn't type again for 800ms, run the onUpdate function.
    const debounceTimer = setTimeout(() => {
      onUpdate(localValue);
    }, 800); // 800ms is a good debounce delay

    // CLEANUP: If the user types again before 800ms, this clears the old timer
    // and a new one is set, effectively resetting the delay.
    return () => {
      clearTimeout(debounceTimer);
    };
  }, [localValue, serverValue, onUpdate]);


  // 2. The actual <input> element.
  // Its `value` is tied to our immediate local state.
  // Its `onChange` updates only our immediate local state.
  return (
    <input
      type="text"
      className={`client-name ${disabled ? 'disabled' : ''}`}
      name={`client-name-input-${id}`}
      
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      
      disabled={disabled}
      dir="rtl"
      placeholder='ר"ת מטופל/ת'
    />
  );
}
