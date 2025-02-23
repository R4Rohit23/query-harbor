import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCookie } from "./useCookie";

/**
 * Custom hook for handling global queries with React Query.
 * @param {Object} params - The parameters for the query.
 * @param {string} params.url - The endpoint URL for the query.
 * @param {Array<string>} params.queryKey - The unique key for identifying and caching the query.
 * @param {string} params.methodType - The HTTP method type (GET, POST, PUT, DELETE).
 * @param {Object} [params.data] - The data to be sent with the request (for POST, PUT methods).
 * @param {boolean} [params.enabled=true] - Whether the query is enabled or disabled.
 * @param {number} [params.cacheTime=300000] - Duration in milliseconds for which the data should remain in cache (default: 5 minutes).
 * @param {number} [params.staleTime=300000] - Duration in milliseconds until the data is considered stale (default: 5 minutes).
 * @returns {Object} An object containing query-related data and functions.
 * @returns {Function} returns.refetchQuery - Function to invalidate and refetch the query.
 * @returns {*} returns.queryData - The data returned from the query.
 * @returns {boolean} returns.isLoading - Whether the query is currently loading.
 * @returns {boolean} returns.isError - Whether the query encountered an error.
 * @returns {*} returns.error - The error object if query failed.
 */
export const useGlobalQuery = ({
    url,
    queryKey,
    methodType,
    data,
    enabled = true,
    cacheTime = 5 * 60 * 1000,
    staleTime = 5 * 60 * 1000,
}) => {
    const queryClient = useQueryClient();

    /**
     * Custom hook to get access token from cookies.
     * @type {Object}
     * @property {Object} cookie - The cookie object containing the access token.
     */
    const { cookie } = useCookie({ cookieName: "accessToken" });

    /**
     * Headers object for the API request.
     * Automatically includes Authorization header if access token is available.
     * @type {Object}
     */
    let headers = {};

    if (cookie?.accessToken) {
        headers = { Authorization: `Bearer ${cookie?.accessToken}` };
    }

    /**
     * React Query hook configuration.
     * Handles data fetching, caching, and error management.
     */
    const query = useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            try {
                const response = await APIHandler({
                    action: methodType,
                    url,
                    data,
                    headers,
                });

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
        cacheTime: cacheTime,
        staleTime: staleTime,
        refetchOnWindowFocus: false,
    });

    /**
     * Invalidates the current query and triggers a refetch.
     * Use this function to manually refresh the query data.
     * @function
     */
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
