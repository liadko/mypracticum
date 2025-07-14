import toast from "react-hot-toast";


export function showError(msg: string, duration = 4000) {
    toast.error(msg, {
        duration,               // ← your new optional time in ms
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



export function showSuccess(msg: string, duration = 4000) {
    toast.success(msg, {
        duration,               // ← your new optional time in ms

        style: {
            background: '#fff',
            color: '#000',
        },

        iconTheme: {
            primary: '#038B7F',
            secondary: '#fff',
        },

    })
}
