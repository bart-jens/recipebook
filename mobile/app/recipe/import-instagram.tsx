import { useEffect } from 'react';
import { router } from 'expo-router';

// Redirect to unified import screen — Instagram links are handled there
export default function ImportInstagramRedirect() {
  useEffect(() => {
    router.replace('/recipe/import-url');
  }, []);

  return null;
}
