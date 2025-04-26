import { useQuery, useQueryClient, UseQueryResult, QueryKey } from "@tanstack/react-query";
import { useCookie } from "./useCookie";
import { APIHandler, ApiSuccessResponse } from "./apiHandler";

// Define types for the useGlobalQuery parameters
interface UseGlobalQueryParams {
    url: string;
    queryKey: QueryKey;
    methodType: "GET" | "POST" | "PUT" | "DELETE";
    data?: any;
    enabled?: boolean;
    staleTime?: number;
    refetchOnWindowFocus?: boolean
}

// Define the return type for useGlobalQuery
interface UseGlobalQueryReturn {
    refetchQuery: () => void;
    queryData: any;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
}

/**
 * Custom hook for handling global queries with React Query.
 * @param {string} url - The endpoint URL for the query.
 * @param {QueryKey} queryKey - The unique key for identifying and caching the query.
 * @param {"GET" | "POST" | "PUT" | "DELETE"} methodType - The HTTP method type.
 * @param {any} [data] - The data to be sent with the request (for POST, PUT methods).
 * @param {boolean} [enabled=true] - Whether the query is enabled or disabled.
 * @param {boolean} [refetchOnWindowFocus] - Refetch on window focus if the data is stale (default: false).
 * @param {number} [staleTime] - Duration in milliseconds until the data is considered stale (default: 5 minutes).
 * 
 * 
 * Return type for the `useGlobalQuery` hook.
 * @return {Function} refetchQuery - Function to invalidate and refetch the query.
 * @return {any} queryData - The data returned from the query.
 * @return {boolean} isLoading - Whether the query is currently loading.
 * @return {boolean} isError - Whether the query encountered an error.
 * @return {unknown} error - The error object if the query failed.

 *
 * @example
 * // Example usage:
 * const { queryData, isLoading, isError, error, refetchQuery } = useGlobalQuery({
 *   url: "/api/data",
 *   queryKey: ["data"],
 *   methodType: "GET",
 * });
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (isError) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     <h1>Data:</h1>
 *     <pre>{queryData.map((data) => <p>{data}</p>)}</pre>
 *     <button onClick={refetchQuery}>Refresh Data</button>
 *   </div>
 * );
 *
 */

export const useGlobalQuery = ({
    url,
    queryKey,
    methodType,
    data,
    enabled = true,
    staleTime = 5 * 60 * 1000,
    refetchOnWindowFocus = false
}: UseGlobalQueryParams): UseGlobalQueryReturn => {
    const queryClient = useQueryClient();

    const { cookie } = useCookie({ cookieName: "accessToken" });

    let headers: any = {};

    if (cookie?.accessToken) {
        headers = { Authorization: `Bearer ${cookie.accessToken}` };
    }

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            try {
                const response = await APIHandler({
                    action: methodType,
                    url,
                    data,
                    headers,
                }) as ApiSuccessResponse;

                if (response?.data) {
                    return response.data;
                } else {
                    return { totalCount: 0, data: [] };
                }
            } catch (error) {
                console.error("Query Error:", error);
                throw error;
            }
        },
        enabled,
        staleTime,
        refetchOnWindowFocus,
    });

    const refetchQuery = () => {
        queryClient.invalidateQueries({ queryKey });
    };

    return {
        refetchQuery,
        queryData: query.data,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
    };
};