import { useMutation, useQueryClient } from "@tanstack/react-query";
import useCookie from "./useCookie";
import { APIHandler } from "./apiHandler";

export const useGlobalMutation = ({
    url,
    queriesToInvalidate,
    methodType,
    data,
    isFormData,
    closePopup,
    excludedIndexKeys,
}) => {
    const queryClient = useQueryClient();
    const { cookie } = useCookie({ cookieName: "accessToken"});

    let headers = {};

    if (cookie?.accessToken) {
        headers = { Authorization: `Bearer ${cookie?.accessToken}` };
    }

    const mutation = useMutation({
        mutationFn: async ({ isPriorityDataAvailable, priorityData }) => {
            const dataToUpload = isPriorityDataAvailable ? priorityData : data;

            if (isFormData) {
                let formData = new FormData();

                // Recursive function to append data to FormData
                const appendToFormData = (
                    formData,
                    data,
                    parentKey = "",
                    options = {}
                ) => {
                    if (data === null || data === undefined) return;

                    const { excludedIndexKeys = [] } = options;

                    if (Array.isArray(data)) {
                        data.forEach((item, index) => {
                            const shouldExcludeIndex =
                                excludedIndexKeys.includes(parentKey);
                            const key = shouldExcludeIndex
                                ? parentKey
                                : parentKey
                                ? `${parentKey}[${index}]`
                                : `${index}`;

                            if (item instanceof File) {
                                formData?.append(key, item);
                            } else if (
                                typeof item === "object" &&
                                item !== null
                            ) {
                                // Recursively handle nested objects in array
                                appendToFormData(formData, item, key, options);
                            } else {
                                formData?.append(key, item);
                            }
                        });
                    } else if (typeof data === "object" && data !== null) {
                        // Handle nested objects
                        if (data instanceof File) {
                            // Append file object directly
                            formData.append(parentKey, data);
                        } else {
                            Object.keys(data).forEach((key) => {
                                const value = data[key];
                                const constructedKey = parentKey
                                    ? `${parentKey}[${key}]`
                                    : key;

                                appendToFormData(
                                    formData,
                                    value,
                                    constructedKey,
                                    options
                                );
                            });
                        }
                    } else if (
                        data !== "" &&
                        data !== undefined &&
                        data !== null
                    ) {
                        // Append primitive values
                        formData?.append(parentKey, data);
                    }
                };

                const options = {
                    excludedIndexKeys,
                };

                // Append all existing data
                Object.keys(dataToUpload).forEach((key) => {
                    appendToFormData(formData, dataToUpload[key], key, options);
                });

                const {
                    status,
                    message,
                    data: responseData,
                } = await APIHandler({
                    action: methodType,
                    url,
                    data: formData,
                    headers,
                });

                if (status) {
                    return responseData;
                } else {
                    const error = new Error(message || "Something went wrong!");
                    throw error;
                }
            } else {
                const {
                    status,
                    message,
                    data: responseData,
                } = await APIHandler({
                    action: methodType,
                    url,
                    data: dataToUpload,
                    headers,
                });

                if (status) {
                    return responseData;
                } else {
                    const error = new Error(message || "Something went wrong!");
                    throw error;
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queriesToInvalidate });
            closePopup && closePopup(false);
        },

        onError: (error) => {
            console.log("mutationError", error?.message);
            return error?.message;
        },
    });

    /**
     * Runs the mutation with optional priority data.
     * @param {Object} [params] - Mutation parameters.
     * @param {boolean} [params.isPriorityDataAvailable] - Whether priority data is available.
     * @param {*} [params.priorityData] - The priority data to be included in the mutation.
     */
    const runMutation = ({ isPriorityDataAvailable, priorityData } = {}) => {
        try {
            mutation.mutate({ isPriorityDataAvailable, priorityData });
        } catch (error) {
            console.log("Mutation Error: ", error);
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