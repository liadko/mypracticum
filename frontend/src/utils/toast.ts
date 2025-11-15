import toast, { type Renderable, type ValueOrFunction } from "react-hot-toast";


export function showError(msg: string, duration = 4000) {
    toast.error(msg, {
        duration,
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
        duration,

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

export function showAsyncToast<T>(
    promise: Promise<T>,
    msgs: { loading: string; success: string; error: string },
    duration = 4000
): Promise<T> {
    return toast.promise(
        promise,
        {
            loading: msgs.loading,
            success: msgs.success,
            error: msgs.error,
        },
        {
            loading: {
                duration,
                style: {
                    background: "#fff",
                    color: "#000",
                },
            },
            success: {
                duration,
                style: {
                    background: "#fff",
                    color: "#000",
                },
                iconTheme: {
                    primary: "#038B7F", // success green
                    secondary: "#fff",
                },
            },
            error: {
                duration,
                style: {
                    background: "#fff",
                    color: "#000",
                },
                iconTheme: {
                    primary: "#f55750", // error red
                    secondary: "#fff",
                },
            },
        }
    )
}

export function showAsyncToastWithError<T>(
    promise: Promise<T>,
    msgs: { loading: string; success: string; error: ValueOrFunction<Renderable, T> },
    duration = 4000
): Promise<T> {
    return toast.promise(
        promise,
        {
            loading: msgs.loading,
            success: msgs.success,
            error: msgs.error,
        },
        {
            loading: {
                duration,
                style: {
                    background: "#fff",
                    color: "#000",
                },
            },
            success: {
                duration,
                style: {
                    background: "#fff",
                    color: "#000",
                },
                iconTheme: {
                    primary: "#038B7F", // success green
                    secondary: "#fff",
                },
            },
            error: {
                duration,
                style: {
                    background: "#fff",
                    color: "#000",
                },
                iconTheme: {
                    primary: "#f55750", // error red
                    secondary: "#fff",
                },
            },
        }
    )
}