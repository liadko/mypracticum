import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import type { Contact } from '../types'

interface Props {
  contacts: Contact[]
  value: string
  onChange: (id: string) => void
}

export function ContactDropdown({ contacts, value, onChange }: Props) {
  return (
    <FormControl variant="standard" sx={{ minWidth:160 }}>
      <InputLabel id="contact-select">בחר</InputLabel>
      <Select
        labelId="contact-select"
        value={value}
        onChange={e => onChange(e.target.value as string)}
      >
        {contacts.map(c=>(
          <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
        ))}
        <MenuItem value="__edit__" sx={{fontStyle:'italic'}}>
          ✎ Edit…
        </MenuItem>
      </Select>
    </FormControl>
  )
}