/** Normalise a couple API response into ExpenseContext SET_COUPLE payload */
export const couplePayload = (couple) => {
  let partnerBName = couple.partnerB?.name || ''
  if (!partnerBName && couple.name) {
    const parts = couple.name.split('&')
    if (parts.length === 2) {
      const potentialB = parts[1].trim()
      if (potentialB && potentialB !== 'Partner') {
        partnerBName = potentialB
      }
    }
  }

  return {
    id:         couple._id,
    inviteCode: couple.inviteCode || '',
    name:       couple.name,
    partnerA:   couple.partnerA?.name || '',
    partnerB:   partnerBName,
  }
}
