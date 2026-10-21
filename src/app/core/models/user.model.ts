/** A team member who can be assigned to tasks. */
export interface User {
  id: string;
  name: string;
  /** Initials shown in avatars, e.g. "JD". */
  avatar: string;
  email: string;
}
