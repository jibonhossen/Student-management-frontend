export async function hashPassword(value) {
  if (!value) {
    return '';
  }

  if (!window.crypto?.subtle) {
    return value;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await window.crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

export default hashPassword;

