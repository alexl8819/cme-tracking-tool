import { 
  BASE_FUNCTIONS_ENDPOINT,
  BASE_API_VERSION
} from '@/constants/Fetch';

const FUNCTION_MODULE = 'courses';

export function getCourse (param, version = BASE_API_VERSION) {
  return async (authToken) => await getCourses(`${BASE_FUNCTIONS_ENDPOINT}/${version}/${FUNCTION_MODULE}/${param}`)(authToken);
}

export function getCourses(url = `${BASE_FUNCTIONS_ENDPOINT}/${BASE_API_VERSION}/${FUNCTION_MODULE}/`) {
  return async (authToken) => {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  
    if (!response.ok) {
      throw new Error(`Unable to fetch courses - status code: ${response.status}`);
    }
  
    const data = await response.json();
    return data;
  }
}

export function removeCourse (param, version = BASE_API_VERSION) {
  return async (authToken) => {
    const response = await fetch(`${BASE_FUNCTIONS_ENDPOINT}/${version}/${FUNCTION_MODULE}/${param}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Unable to delete course: ${response.status}`);
    }
  }
}

export function submitCourse (body, version = BASE_API_VERSION) {
  return async (authToken) => {
    const headers = {
      'Authorization': `Bearer ${authToken}`
    };
    
    if (!(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(`${BASE_FUNCTIONS_ENDPOINT}/${version}/${FUNCTION_MODULE}/`, {
      headers,
      body,
      method: 'POST',
    });

    if (!response.ok) {
      const err = await response.json();
      console.error(err);
      throw new Error(`Failed to submit course - status code: ${response.status}`);
    }
  }
}
