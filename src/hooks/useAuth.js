import { useEffect, useState, useCallback } from "react";
import { signIn, signOut, getSession, getProfile, onAuthStateChange } from "../services/authService";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFromSession = useCallback(async (session) => {
    if (!session?.user) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const prof = await getProfile(session.user.id);
      
      // Si el usuario tiene sesión activa pero fue borrado de la tabla 'usuarios'
      if (!prof) {
        console.warn("El usuario autenticado no existe en la tabla de perfiles. Cerrando sesión...");
        await signOut(); // Limpiamos la sesión corrupta
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(session.user);
      setProfile(prof);
    } catch (e) {
      console.error("No se pudo cargar el perfil del usuario:", e.message);
      setUser(null);
      setProfile(null);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    getSession().then(loadFromSession);
    const sub = onAuthStateChange(loadFromSession);
    return () => sub?.unsubscribe();
  }, [loadFromSession]);

  const login = async (email, password) => {
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setError("Usuario o contraseña incorrectos.");
      throw e;
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
  };

  return { user, profile, loading, error, login, logout };
}