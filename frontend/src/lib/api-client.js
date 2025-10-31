const API_URL = 'https://enigma.shubh.sh';


export async function createUser(request) {
  const response = await fetch(`${API_URL}/users/clerk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clerk_id: request.external_id,
      name: request.name,
      email: request.email,
    }),
  });

  if (!response.ok) {
    const error = {
      message: `Failed to create user: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }

  return response.json();
}

export async function getUserById(userId) {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = {
      message: `Failed to fetch user: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }

  return response.json();
}


export async function getUserByExternalId(externalId) {
  try {
    const response = await fetch(`${API_URL}/users/clerk/${externalId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = {
        message: `Failed to fetch user: ${response.statusText}`,
        status: response.status,
      };
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}


export async function createApi(userId, request) {
  try {
    const validRequest = {
      ...request,
      category: ensureValidCategory(request.category),
      endpoints: request.endpoints.map(endpoint => ({
        ...endpoint,
        path: endpoint.path.startsWith('/') ? endpoint.path : `/${endpoint.path}`
      }))
    };
    
    const response = await fetch(`${API_URL}/users/${userId}/apis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validRequest),
    });

    if (!response.ok) {
      let errorMsg = `Server error (${response.status})`;
      
      try {
        const errorBody = await response.json();
        if (response.status === 422) {
          errorMsg = "Validation failed: ";
          
          if (typeof errorBody === 'object') {
            const details = Object.entries(errorBody)
              .map(([key, value]) => `${key}: ${value}`)
              .join('; ');
            errorMsg += details || "Missing or invalid fields";
          } else {
            errorMsg += String(errorBody);
          }
        } else {
          errorMsg = typeof errorBody === 'string' 
            ? errorBody 
            : (errorBody?.message || errorBody?.error || response.statusText);
        }
      } catch (e) {
        errorMsg = response.statusText || `Error code: ${response.status}`;
      }
      
      throw new Error(`Failed to create API: ${errorMsg}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`API creation failed: Unexpected error`);
    }
  }
}

function ensureValidCategory(category) {
  const sharedCategories = [
    'Tools', 'Weather', 'Finance', 'Sports', 'Entertainment',
    'Gaming', 'Education', 'Travel', 'Food', 'Business',
    'Science', 'Transportation', 'Other'
  ];
  
  return sharedCategories.includes(category) ? category : 'Other';
}


export async function listUserApis(userId) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/apis`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      const error = {
        message: `Failed to fetch APIs: ${response.statusText}`,
        status: response.status,
      };
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getApi(userId, apiId) {
  const response = await fetch(`${API_URL}/users/${userId}/apis/${apiId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = {
      message: `Failed to fetch API: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }

  return response.json();
}


export async function updateApi(userId, apiId, request) {
  const response = await fetch(`${API_URL}/users/${userId}/apis/${apiId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = {
      message: `Failed to update API: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }

  return response.json();
}


export async function deleteApi(userId, apiId) {
  const response = await fetch(`${API_URL}/users/${userId}/apis/${apiId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = {
      message: `Failed to delete API: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }
}

export async function listAllApis() {
  try {
    const response = await fetch(`${API_URL}/apis`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      const error = {
        message: `Failed to fetch marketplace APIs: ${response.statusText}`,
        status: response.status,
      };
      throw error;
    }

    try {
      const text = await response.text();
      
      if (!text) {
        return [];
      }
      
      const data = JSON.parse(text);
      return data;
    } catch (parseError) {
      return [];
    }
  } catch (error) {
    throw error;
  }
}
