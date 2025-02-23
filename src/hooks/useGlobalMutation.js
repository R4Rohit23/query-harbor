import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCookie } from "./useCookie";
import { APIHandler } from "./apiHandler";

/**
 * Custom hook for handling global mutations with React Query.
 * @param {Object} params - The parameters for the mutation.
 * @param {string} params.url - The endpoint URL for the mutation.
 * @param {Array<string>} params.queriesToInvalidate - Array of query keys to invalidate after successful mutation.
 * @param {string} params.methodType - The HTTP method type (POST, PUT, DELETE).
 * @param {Object} [params.data] - The default data to be sent with the mutation.
 * @param {boolean} [params.isFormData] - Whether the data should be processed as FormData.
 * @param {Function} [params.closePopup] - Optional callback to close a popup after successful mutation.
 * @param {Array<string>} [params.excludedIndexKeys] - Keys for which array indices should not be included in FormData.
 * @returns {Object} An object containing mutation-related functions and state.
 */
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
     * React Query mutation hook configuration.
     * Handles data mutations, cache invalidation, and error management.
     */
    const mutation = useMutation({
        /**
         * Mutation function that processes and sends data to the API.
         * @async
         * @param {Object} params - Mutation parameters.
         * @param {boolean} [params.isPriorityDataAvailable] - Whether to use priority data.
         * @param {*} [params.priorityData] - Priority data to override default data.
         * @returns {Promise<*>} The response data from the API.
         * @throws {Error} If the API request fails.
         */
        mutationFn: async ({ isPriorityDataAvailable, priorityData }) => {
            const dataToUpload = isPriorityDataAvailable ? priorityData : data;

            if (isFormData) {
                let formData = new FormData();

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
                                appendToFormData(formData, item, key, options);
                            } else {
                                formData?.append(key, item);
                            }
                        });
                    } else if (typeof data === "object" && data !== null) {
                        if (data instanceof File) {
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
                        formData?.append(parentKey, data);
                    }
                };

                const options = {
                    excludedIndexKeys,
                };

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

        /**
         * Callback executed on successful mutation.
         * Invalidates specified queries and closes popup if provided.
         */
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queriesToInvalidate });
            closePopup && closePopup(false);
        },

        /**
         * Callback executed on mutation error.
         * @param {Error} error - The error object from the failed mutation.
         * @returns {string} The error message.
         */
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
