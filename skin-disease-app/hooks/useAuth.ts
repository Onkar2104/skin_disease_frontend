import { useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const isLoggedIn = !!user;

  return { user, setUser, isLoggedIn };
}
