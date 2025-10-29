const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface CreateUserWithClerkIdRequest {
  clerk_id: string;
  name: string;
  email: string;
}

export interface ApiError {
  message: string;
  status: number;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type ApiCategory =
  | 'Tools'
  | 'Weather'
  | 'Finance'
  | 'Sports'
  | 'NewsMedia'
  | 'Entertainment'
  | 'Gaming'
  | 'Education'
  | 'Health'
  | 'Travel'
  | 'Food'
  | 'Shopping'
  | 'SocialMedia'
  | 'Business'
  | 'Technology'
  | 'Science'
  | 'Government'
  | 'Transportation'
  | 'RealEstate'
  | 'Environment'
  | 'Other';

export interface ApiEndpoint {
  path: string;
  method: HttpMethod;
  headers?: Record<string, any>;
  body_schema?: Record<string, any>;
  query_params?: Record<string, any>;
}

export interface PaymentConfig {
  sol_public_key: string;
  cost_per_request: number;
  enabled: boolean;
}

export interface Api {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: ApiCategory;
  base_url: string;
  endpoints: ApiEndpoint[];
  payment_config?: PaymentConfig;
  created_at: string;
  updated_at: string;
}

export interface CreateApiRequest {
  name: string;
  description?: string;
  category: ApiCategory;
  base_url: string;
  endpoints: ApiEndpoint[];
  payment_config?: PaymentConfig;
}


export async function createUserWithClerkId(
  request: CreateUserWithClerkIdRequest
): Promise<User> {
  const response = await fetch(`${API_URL}/users/clerk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `Failed to create user: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }

  return response.json();
}

export async function getUserById(userId: string): Promise<User | null> {
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
    const error: ApiError = {
      message: `Failed to fetch user: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }

  return response.json();
}


export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/users/clerk/${clerkId}`, {
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
      const error: ApiError = {
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


export async function createApi(
  userId: string,
  request: CreateApiRequest
): Promise<Api> {
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

function ensureValidCategory(category: ApiCategory): ApiCategory {
  const sharedCategories = [
    'Tools', 'Weather', 'Finance', 'Sports', 'Entertainment',
    'Gaming', 'Education', 'Travel', 'Food', 'Business',
    'Science', 'Transportation', 'Other'
  ];
  
  return sharedCategories.includes(category) ? category : 'Other';
}


export async function listUserApis(userId: string): Promise<Api[]> {
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
      const error: ApiError = {
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

export async function getApi(userId: string, apiId: string): Promise<Api | null> {
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
    const error: ApiError = {
      message: `Failed to fetch API: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }

  return response.json();
}


export async function updateApi(
  userId: string,
  apiId: string,
  request: CreateApiRequest
): Promise<Api> {
  const response = await fetch(`${API_URL}/users/${userId}/apis/${apiId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `Failed to update API: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }

  return response.json();
}


export async function deleteApi(userId: string, apiId: string): Promise<void> {
  const response = await fetch(`${API_URL}/users/${userId}/apis/${apiId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `Failed to delete API: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }
}

export async function listAllApis(): Promise<Api[]> {
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
      const error: ApiError = {
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
