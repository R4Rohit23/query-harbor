import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { APIHandler } from "./apiHandler";
import { useCookie } from "./useCookie";

/**
 * Custom hook for handling infinite scrolling queries with React Query.
 * @param {Object} params - The parameters for the infinite query.
 * @param {string} params.url - The endpoint URL for the query.
 * @param {Array<string>} params.queryKey - The unique key for identifying and caching the query.
 * @param {string} params.methodType - The HTTP method type (GET, POST, PUT, DELETE).
 * @param {Object} [params.data] - Additional data to be sent with each request.
 * @param {boolean} [params.enabled=true] - Whether the query is enabled or disabled.
 * @param {number} [params.cacheTime=300000] - Duration in milliseconds for which the data should remain in cache (default: 5 minutes).
 * @param {number} [params.staleTime=300000] - Duration in milliseconds until the data is considered stale (default: 5 minutes).
 * @returns {Object} An object containing query-related data and functions.
 * @returns {Function} returns.refetchQuery - Function to invalidate and refetch the query.
 * @returns {Array} returns.queryData - Flattened array of all fetched items across pages.
 * @returns {boolean} returns.isLoading - Whether the query is currently loading.
 * @returns {boolean} returns.isError - Whether the query encountered an error.
 * @returns {*} returns.error - The error object if query failed.
 * @returns {Function} returns.fetchNextPage - Function to fetch the next page of data.
 * @returns {boolean} returns.hasNextPage - Whether there are more pages to fetch.
 * @returns {number} returns.totalCount - Total number of items available.
 */
export const useGlobalInfiniteQuery = ({
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
     * React Query infinite query hook configuration.
     * Handles paginated data fetching, caching, and error management.
     */
    const query = useInfiniteQuery({
        queryKey: queryKey,
        queryFn: async ({ pageParam }) => {
            try {
                const response = await APIHandler({
                    action: methodType,
                    url,
                    data: {
                        ...data,
                        page: pageParam,
                    },
                    headers,
                });

                if (response?.data) {
                    const { data, page, totalPages, totalCount } =
                        response?.data;

                    const hasMore = page < totalPages;

                    return {
                        data,
                        nextPage: hasMore ? page + 1 : undefined,
                        hasMore,
                        totalCount,
                    };
                } else {
                    return { totalCount: 0, data: [] };
                }
            } catch (error) {
                console.error("Query Error:", error);
                throw error;
            }
        },
        /**
         * Function to determine the next page parameter for pagination.
         * @param {Object} lastPage - The data from the last fetched page.
         * @param {boolean} lastPage.hasMore - Whether more pages exist.
         * @param {number} [lastPage.nextPage] - The next page number.
         * @returns {number|undefined} The next page parameter or undefined if no more pages.
         */
        getNextPageParam: (lastPage) => {
            return lastPage.hasMore ? lastPage.nextPage : undefined;
        },
        enabled,
        cacheTime: cacheTime,
        staleTime: staleTime,
        refetchOnWindowFocus: false,
    });

    /**
     * Invalidates the current query and triggers a refetch.
     * Use this function to manually refresh all pages of data.
     * @function
     */
    const refetchQuery = () => {
        queryClient.invalidateQueries({ queryKey });
    };

    /**
     * Flattens all pages of data into a single array and extracts total count.
     * @type {Array}
     */
    const items = query?.data?.pages?.flatMap((page) => page.data) || [];

    /**
     * Total number of items available across all pages.
     * @type {number}
     */
    const totalCount = query?.data?.pages?.[0]?.totalCount ?? 0;

    return {
        refetchQuery,
        queryData: items,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        fetchNextPage: query.fetchNextPage,
        hasNextPage: query.hasNextPage,
        totalCount,
    };
};
