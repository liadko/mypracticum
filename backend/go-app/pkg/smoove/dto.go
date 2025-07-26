package smoove

// KeyValue is a generic key/value pair for customData.
type KeyValue struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// MemberID is a simple alias for int64, makes your intent clearer.
type MemberID int64

// EmailRequest models exactly the JSON shape you showed.
type EmailRequest struct {
	CustomData       []KeyValue `json:"customData"`
	ToMembersById    []MemberID `json:"toMembersById"`
	ToMembersByEmail []string   `json:"toMembersByEmail"`
}
