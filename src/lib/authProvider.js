/**
 * Whether this account signs in with Google rather than a Stelli password.
 * The provider shape varies, so every known field is checked.
 */
export function isGoogleUser(user) {
  const values = [
    user?.auth_provider,
    user?.provider,
    user?.login_provider,
    user?.sign_in_provider,
    ...(Array.isArray(user?.providers) ? user.providers : []),
    ...(Array.isArray(user?.auth_providers) ? user.auth_providers : []),
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return values.some((value) => value.includes('google'));
}