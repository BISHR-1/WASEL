const API_BASE = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || import.meta.env.VITE_API_URL || '/api';

export async function sendEmailOtp(email) {
  const response = await fetch(`${API_BASE}/send-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { success: false, error: data?.error || 'Failed to send OTP' };
  }
  return data;
}

export async function verifyEmailOtp(email, code, token) {
  const response = await fetch(`${API_BASE}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, code, token })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { success: false, error: data?.error || 'Failed to verify OTP' };
  }
  return data;
}