import { useCookies } from "react-cookie";

/**
 * Custom hook for managing browser cookies.
 * @param {Object} params - The parameters for the cookie hook.
 * @param {string} params.cookieName - The name of the cookie to manage.
 * @returns {Object} An object containing cookie management functions and state.
 * @returns {Object} returns.cookie - The current cookie value.
 * @returns {Function} returns.setCookie - Function to set a new cookie value.
 * @returns {Function} returns.removeCookie - Function to remove the cookie.
 * 
 * @example
 * // Usage example:
 * const { cookie, setCookie, removeCookie } = useCookie({ cookieName: "accessToken" });
 * 
 * // Get cookie value
 * const token = cookie.accessToken;
 * 
 * // Set new cookie
 * setCookie("accessToken", "new-token-value", { path: "/", maxAge: 3600 });
 * 
 * // Remove cookie
 * removeCookie("accessToken", { path: "/" });
 */
export const useCookie = ({ cookieName }) => {
    /**
     * Hook from react-cookie that provides cookie management functions.
     * @type {[Object, Function, Function]}
     */
    const [cookie, setCookie, removeCookie] = useCookies([cookieName]);

    return { cookie, setCookie, removeCookie };
};