import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCookie } from "./useCookie";
import { APIHandler, ApiSuccessResponse } from "./apiHandler";

interface UseGlobalMutationParams<T> {
    url: string;
    queriesToInvalidate?: string[];
    methodType: "POST" | "PUT" | "DELETE";
    data?: T;
    isFormData?: boolean;
    closePopup?: (state: boolean) => void;
    excludedIndexKeys?: string[];
}

interface MutationFunctionParams<T> {
    isPriorityDataAvailable?: boolean;
    priorityData?: T;
}

/**
 * Custom hook for handling global mutations with React Query.
 * @param {string} url - The endpoint URL for the mutation.
 * @param {Array<string>} queriesToInvalidate - Array of query keys to invalidate after successful mutation.
 * @param {string} methodType - The HTTP method type (POST, PUT, DELETE).
 * @param {Object} [data] - The default data to be sent with the mutation.
 * @param {boolean} [isFormData] - Whether the data should be processed as FormData.
 * @param {Function} [closePopup] - Optional callback to close a popup after successful mutation.
 * @param {Array<string>} [excludedIndexKeys] - Keys for which array indices should not be included in FormData.
 * @returns {Object} An object containing mutation-related functions and state.
 */
export const useGlobalMutation = <T extends Record<string, any>>({
    url,
    queriesToInvalidate,
    methodType,
    data,
    isFormData,
    closePopup,
    excludedIndexKeys,
}: UseGlobalMutationParams<T>) => {
    const queryClient = useQueryClient();
    const { cookie } = useCookie({ cookieName: "accessToken" });

    let headers: any = {};

    if (cookie?.accessToken) {
        headers = { Authorization: `Bearer ${cookie?.accessToken}` };
    }

    const mutation = useMutation({
        mutationFn: async ({ isPriorityDataAvailable, priorityData }: MutationFunctionParams<T>) => {
            const dataToUpload = isPriorityDataAvailable ? priorityData : data;

            if (isFormData) {
                const formData = new FormData();

                const appendToFormData = (
                    formData: FormData,
                    data: any,
                    parentKey = "",
                    options: { excludedIndexKeys?: string[] } = {}
                ) => {
                    if (data == null) return;
                    const { excludedIndexKeys = [] } = options;

                    if (Array.isArray(data)) {
                        data.forEach((item, index) => {
                            const shouldExcludeIndex = excludedIndexKeys.includes(parentKey);
                            const key = shouldExcludeIndex ? parentKey : parentKey ? `${parentKey}[${index}]` : `${index}`;

                            if (item instanceof File) {
                                formData.append(key, item);
                            } else if (typeof item === "object" && item !== null) {
                                appendToFormData(formData, item, key, options);
                            } else {
                                formData.append(key, String(item));
                            }
                        });
                    } else if (typeof data === "object" && data !== null) {
                        if (data instanceof File) {
                            formData.append(parentKey, data);
                        } else {
                            Object.keys(data).forEach((key) => {
                                appendToFormData(formData, data[key], parentKey ? `${parentKey}[${key}]` : key, options);
                            });
                        }
                    } else {
                        formData.append(parentKey, String(data));
                    }
                };

                Object.keys(dataToUpload || {}).forEach((key) => {
                    appendToFormData(formData, dataToUpload?.[key], key, { excludedIndexKeys });
                });

                const { status, message, data: responseData } = await APIHandler({
                    action: methodType,
                    url,
                    data: formData,
                    headers,
                }) as ApiSuccessResponse;

                if (status) {
                    return responseData;
                } else {
                    throw new Error(message || "Something went wrong!");
                }
            } else {
                const { status, message, data: responseData } = await APIHandler({
                    action: methodType,
                    url,
                    data: dataToUpload,
                    headers,
                }) as ApiSuccessResponse;

                if (status) {
                    return responseData;
                } else {
                    throw new Error(message || "Something went wrong!");
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queriesToInvalidate });
            if (closePopup) closePopup(false);
        },
        onError: (error: Error) => {
            console.error("mutationError", error.message);
            return error.message;
        },
    });

    const runMutation = (params?: MutationFunctionParams<T>) => {
        try {
            mutation.mutate(params || {});
        } catch (error) {
            console.error("Mutation Error: ", error);
        }
    };

    return {
        runMutation,
        mutationLoading: mutation.isPending,
        mutationData: mutation.data,
        mutationError: mutation.error?.message,
        isMutationSucceeded: mutation.isSuccess,
    };
};
