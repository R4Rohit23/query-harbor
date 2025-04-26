import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { APIHandler, ApiSuccessResponse } from "./apiHandler";
import { useCookie } from "./useCookie";

interface UseGlobalInfiniteQueryParams<T> {
    url: string;
    queryKey: string[];
    methodType: "GET" | "POST" | "PUT" | "DELETE";
    data?: T;
    enabled?: boolean;
    staleTime?: number;
}

interface APIResponse<T> {
    data: T[];
    page: number;
    totalPages: number;
    totalCount: number;
}

interface QueryResult<T> {
    data: T[];
    nextPage?: number;
    hasMore: boolean;
    totalCount: number;
}

/**
 * Custom hook for handling infinite scrolling queries with React Query.
 */
export const useGlobalInfiniteQuery = <T>({
    url,
    queryKey,
    methodType,
    data,
    enabled = true,
    staleTime = 5 * 60 * 1000,
}: UseGlobalInfiniteQueryParams<T>) => {
    const queryClient = useQueryClient();

    const { cookie } = useCookie({ cookieName: "accessToken" });

    let headers: any = {};

    if (cookie?.accessToken) {
        headers = { Authorization: `Bearer ${cookie.accessToken}` };
    }

    const query = useInfiniteQuery<QueryResult<T>>({
        queryKey,
        queryFn: async ({ pageParam = 1 }): Promise<QueryResult<T>> => {
            try {
                const response = await APIHandler({
                    action: methodType,
                    url,
                    data: {
                        ...data,
                        page: pageParam,
                    },
                    headers,
                }) as ApiSuccessResponse;

                if (response?.data) {
                    const { data, page, totalPages, totalCount } =
                        response.data as APIResponse<T>;

                    const hasMore = page < totalPages;

                    return {
                        data,
                        nextPage: hasMore ? page + 1 : undefined,
                        hasMore,
                        totalCount,
                    };
                } else {
                    return { totalCount: 0, data: [], hasMore: false };
                }
            } catch (error) {
                console.error("Query Error:", error);
                throw error;
            }
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextPage : undefined),
        enabled,
        staleTime,
        refetchOnWindowFocus: false,
    });

    const refetchQuery = () => {
        queryClient.invalidateQueries({ queryKey });
    };

    const items = query?.data?.pages?.flatMap((page: any) => page.data) || [];
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
