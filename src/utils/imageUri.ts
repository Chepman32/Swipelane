const URI_WITH_SCHEME = /^(file|content|ph|assets-library):\/\//i;

export const normalizeImageUri = (uri?: string | null): string => {
  if (!uri) {
    return '';
  }
  if (URI_WITH_SCHEME.test(uri)) {
    return uri;
  }
  if (uri.startsWith('/')) {
    return `file://${uri}`;
  }
  return uri;
};

export const normalizeImageUris = (uris: string[]): string[] =>
  uris.map(uri => normalizeImageUri(uri));
