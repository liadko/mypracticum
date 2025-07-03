import toast from "react-hot-toast";

export function showError(msg: string) {
    toast.error(msg, {
        style: {
            background: '#fff',
            color: '#000',
        },

        iconTheme: {
            primary: '#f55750',
            secondary: '#fff',
        },

    })
}
