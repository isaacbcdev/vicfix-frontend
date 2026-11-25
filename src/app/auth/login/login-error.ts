/** Login failure → user-facing message. Only a real 401 blames the credentials. */
export function loginErrorMessage(status: number, backendMessage: string | null): string {
  if (status === 0) {
    // No response: offline, DNS, CORS, or a gateway error without CORS headers (backend down).
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet o intenta de nuevo en unos minutos.';
  }
  if (status === 401) {
    // Coupled to the backend text: AuthApiController returns 401 for both bad credentials and
    // DisabledException, telling them apart only by message ("Esta cuenta está desactivada...").
    // If that text changes, this falls back to the credentials message.
    if (backendMessage?.toLowerCase().includes('desactivada')) {
      return 'Tu usuario está desactivado. Habla con el administrador.';
    }
    return 'Usuario o contraseña incorrectos.';
  }
  if (status === 423) return 'Cuenta bloqueada temporalmente. Intenta de nuevo en unos minutos.';
  if (status === 400) return 'Ingresa tu usuario y contraseña.';
  if (status >= 500 && status <= 599) {
    return 'El servidor no está disponible. Intenta de nuevo en unos minutos.';
  }
  return 'No se pudo iniciar sesión. Intenta de nuevo.';
}
