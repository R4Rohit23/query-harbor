import { useQuery, useQueryClient } from "@tanstack/react-query";
import useCookie from "./useCookie";

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
    const { cookie } = useCookie({ cookieName: "accessToken"});

    let headers = {};

    if (cookie?.accessToken) {
        headers = { Authorization: `Bearer ${cookie?.accessToken}` };
    }

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
