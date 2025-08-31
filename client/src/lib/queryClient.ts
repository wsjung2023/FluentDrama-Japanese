import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorData;
    try {
      // Try to parse as JSON first
      const clonedResponse = res.clone();
      errorData = await clonedResponse.json();
    } catch {
      // If JSON parsing fails, get text
      errorData = await res.text() || res.statusText;
    }
    
    const error = new Error(`${res.status}: ${typeof errorData === 'string' ? errorData : errorData.message || 'Unknown error'}`);
    (error as any).status = res.status;
    (error as any).response = errorData;
    throw error;
  }
}

// Safe JSON parser helper
export async function safeJsonParse(response: Response): Promise<any> {
  // Clone the response first to avoid "body already used" errors
  const clonedResponse = response.clone();
  
  try {
    // Check if response is actually JSON by checking content-type
    const contentType = response.headers.get('content-type');
    
    // If no content-type or not JSON, try to read as text first
    if (!contentType || !contentType.includes('application/json')) {
      let responseText = '';
      try {
        responseText = await clonedResponse.text();
      } catch (textError) {
        console.error('Could not read response as text:', textError);
        throw new Error('서버 응답을 읽을 수 없습니다.');
      }
      
      console.error('Expected JSON but got:', responseText.substring(0, 100));
      
      // Check if it's an HTML error page
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        throw new Error('서버에서 오류 페이지를 반환했습니다. 잠시 후 다시 시도해주세요.');
      }
      
      throw new Error(`서버에서 예상하지 못한 응답 형식을 받았습니다: ${contentType || 'unknown'}`);
    }
    
    // Try to parse as JSON
    return await response.json();
    
  } catch (error: any) {
    console.error('JSON parsing failed:', error);
    
    // Don't try to read response again if we already failed
    const errorMessage = error.message || '알 수 없는 오류';
    
    if (errorMessage.includes('already used') || errorMessage.includes('서버에서')) {
      throw error; // Re-throw our custom errors
    }
    
    throw new Error('서버 응답을 처리할 수 없습니다. 네트워크 연결을 확인해주세요.');
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
