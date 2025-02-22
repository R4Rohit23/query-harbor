import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { APIHandler } from "./apiHandler";
import useCookie from "./useCookie";

const useGlobalInfiniteQuery = ({
    url,
    queryKey,
    methodType,
    data,
    enabled = true,
    cacheTime = 5 * 60 * 1000,
    staleTime = 5 * 60 * 1000,
}) => {
    const queryClient = useQueryClient();
    const { cookie } = useCookie({ cookieName: "accessToken" });

    let headers = {};

    if (cookie?.accessToken) {
        headers = { Authorization: `Bearer ${cookie?.accessToken}` };
    }

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
        getNextPageParam: (lastPage) => {
            return lastPage.hasMore ? lastPage.nextPage : undefined;
        },
        enabled,
        cacheTime: cacheTime,
        staleTime: staleTime,
        refetchOnWindowFocus: false,
    });

    const refetchQuery = () => {
        queryClient.invalidateQueries({ queryKey });
    };

    const items = query?.data?.pages?.flatMap((page) => page.data) || [];
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

export default useGlobalInfiniteQuery;
