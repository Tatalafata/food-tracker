export const feedbackLimit = 2000;

export function feedbackEndpoint(value: string | undefined) {
  const url = value?.trim() ?? '';
  return /^https:\/\/formspree\.io\/f\/[a-z0-9]+$/i.test(url) ? url : null;
}

export type FeedbackResult = 'sent' | 'limited' | 'failed';

export async function sendFeedback(endpoint: string, message: string): Promise<FeedbackResult> {
  const text = message.trim();
  if (!feedbackEndpoint(endpoint) || !text || text.length > feedbackLimit) return 'failed';

  const form = new FormData();
  form.append('message', text);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: form,
      signal: controller.signal,
    });
    if (response.status === 429) return 'limited';
    if (!response.ok) return 'failed';
    const data = await response.json();
    if (!data || data.errors || data.error) return 'failed';
    return data.ok === true || typeof data.next === 'string' ? 'sent' : 'failed';
  } catch {
    return 'failed';
  } finally {
    clearTimeout(timeout);
  }
}
