import { 
  BASE_FUNCTIONS_ENDPOINT,
  BASE_API_VERSION
} from '@/constants/Fetch';

const FUNCTION_MODULE = 'accounts';

export function getAccountInfo (version = BASE_API_VERSION) {
  return async (authToken) => {
    console.log(authToken);
    const response = await fetch(`${BASE_FUNCTIONS_ENDPOINT}/${version}/${FUNCTION_MODULE}/`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  
    if (!response.ok) {
      throw new Error(`Unable to fetch account - status code: ${response.status}`);
    }
  
    const data = await response.json();
    return data;
  }
}

/*export function registerAccount (url, formBody) {
  return async (authToken) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formBody
    });

    if (!response.ok) {
      const err = await response.json();
      console.error(err);
      throw new Error(`Failed to submit course - status code: ${response.status}`);
    }
  }
}*/
