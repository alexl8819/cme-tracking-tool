import { 
  deleteAsync,
  uploadAsync,
  downloadAsync, 
  readAsStringAsync, 
  writeAsStringAsync,
  cacheDirectory,
  FileSystemUploadType,
  EncodingType,
} from 'expo-file-system';

export async function downloadAsset (url, defaultMimeType = 'image/jpeg') {
  // Sniff out remote asset mimetype
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Non-200 response received');
  }
  const mimeType = response.headers.get('Content-Type') || defaultMimeType;
  // Download content to tmp dir
  const { uri: tmpFileUri } = await downloadAsync(url, `${cacheDirectory}/tmp-${Date.now()}.cme`);
  console.log(`tmp file uri: ${tmpFileUri}`); 
  const result = await _readFile(tmpFileUri, 'base64');
  // Delete temp file
  await _cleanup(tmpFileUri);
  return {
    result,
    mimeType
  };
}

export async function uploadAsset (asset, submitFn, authToken) {
  const { contents, mimeType, params } = asset;
  const ext = mimeType.split('/')[1];
  // Create empty tmp file
  const safUri = `${cacheDirectory}/tmp-${Date.now()}.${ext}`; 
  // Write contents to new tmp file
  await writeAsStringAsync(safUri, contents, {
    encoding: EncodingType.UTF8
  });
  // Append fields and file to form
  const formData = new FormData();
  for (const [key, value] of Object.entries(params)) {
    formData.append(key, value);
  }
  formData.append('cert', {
    uri: safUri,
    name: 'cert.jpeg',
    type: mimeType
  });
  const result = await submitFn(formData)(authToken);
  // Cleanup
  await _cleanup(safUri);
  return result;
}

async function _readFile (fileUri, encoding = 'utf8') {
  const file = await readAsStringAsync(fileUri, {
    encoding: encoding === 'base64' ? EncodingType.Base64 : EncodingType.UTF8
  });
  return file;
}

async function _cleanup (fileUri) {
  await deleteAsync(fileUri);
}
