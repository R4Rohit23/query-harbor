import axios, { AxiosRequestHeaders, AxiosResponse } from "axios";

// Define types for the ActionHandler parameters
interface ActionHandlerParams {
    action: "GET" | "POST" | "PUT" | "DELETE";
    url: string;
    data?: any;
    headers?: AxiosRequestHeaders;
}

// Define types for the API response
export interface ApiSuccessResponse {
    status: true;
    data: any;
    message?: string;
    statusCode: number;
}

interface ApiErrorResponse {
    status: false;
    error: string;
    message: string;
    statusCode?: number;
    type?: string;
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

// ActionHandler function
export const ActionHandler = async ({ action, url, data, headers }: ActionHandlerParams): Promise<AxiosResponse> => {
    switch (action) {
        case "GET":
            return await axios.get(url, { headers });

        case "POST":
            return await axios.post(url, data, { headers });

        case "PUT":
            return await axios.put(url, data, { headers });

        case "DELETE":
            return await axios.delete(url, { data, headers });

        default:
            throw new Error(`Invalid action: ${action}`);
    }
};

// APIHandler function
export const APIHandler = async ({ action, url, data, headers }: ActionHandlerParams): Promise<ApiResponse> => {
    try {
        const response = await ActionHandler({ action, url, data, headers });

        if (response.status >= 200 && response.status <= 299) {
            return {
                status: true,
                data: response.data,
                message: response.data.message,
                statusCode: response.status,
            };
        }

        return {
            status: false,
            error: "API Failed",
            message: "API Failed",
            statusCode: response.status,
        };
    } catch (e) {
        if (axios.isAxiosError(e)) {
            const error = e as any;

            if (error.message === "Network Error") {
                return {
                    status: false,
                    error: "Network Error",
                    message: "Network Error",
                };
            }

            return {
                status: false,
                type: error.response?.data?.type,
                message: error.response?.data?.message || "API Failed",
                error: error.response?.data?.error || "API Failed",
                statusCode: error.response?.status,
            };
        }

        return {
            status: false,
            error: "API Failed",
            message: "API Failed",
        };
    }
};