import type { DocumentDto } from './types';

export async function fetchDocumentById(params: {
  apiUrl: string;
  accessToken: string;
  deviceId: string;
  profileId: string;
  documentId: string;
}): Promise<DocumentDto> {
  const { apiUrl, accessToken, deviceId, profileId, documentId } = params;

  const res = await fetch(`${apiUrl}/documents/${documentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Device-ID': deviceId,
      'X-Profile-ID': profileId,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to load document');
  }

  return data as DocumentDto;
}
