export function profileInitials(firstName: string, lastName: string, email: string) {
  const initials = [firstName, lastName]
    .map((value) => Array.from(value.trim())[0] ?? "")
    .join("")
    .toLocaleUpperCase();

  if (initials) return initials;
  return (Array.from(email.trim())[0] ?? "?").toLocaleUpperCase();
}
