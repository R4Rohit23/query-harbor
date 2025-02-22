import { useCookies } from "react-cookie";

const useCookie = ({ cookieName }) => {
    const [cookie, setCookie, removeCookie] = useCookies([cookieName]);

    return { cookie, setCookie, removeCookie };
};

export default useCookie;
