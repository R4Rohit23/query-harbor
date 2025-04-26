import { useCookies } from "react-cookie";

/**
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

export const useCookie = ({ cookieName }: { cookieName: string }) => {
    const [cookie, setCookie, removeCookie] = useCookies([cookieName]);

    return { cookie, setCookie, removeCookie };
};
