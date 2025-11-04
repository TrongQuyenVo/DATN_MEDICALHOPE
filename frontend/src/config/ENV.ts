export const ENV = {
    API_URL_BACKEND: import.meta.env.VITE_REACT_API_URL_BACKEND,
    API_URL_BACKEND_SOCKET: import.meta.env.VITE_REACT_API_URL_BACKEND_SOCKET,
    BASE_URL: import.meta.env.VITE_REACT_BASE_URL,
    CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_REACT_CLOUDINARY_CLOUD_NAME,
    UPLOAD_PRESET: import.meta.env.VITE_REACT_UPLOAD_PRESET,
    TINYMCE_APIKEY: import.meta.env.VITE_REACT_APIKEY_TINYMCE,
    GOOGLE_CLIENT_ID: import.meta.env.VITE_REACT_GOOGLE_CLIENT_ID,
    ACCOUNT_PAYMENT: import.meta.env.VITE_REACT_ACCOUNT_PAYMENT,
    ARB_BANK_CODE: import.meta.env.VITE_REACT_ARB_BANK_CODE,
    GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
    // VNPAY
    // vnp_TmnCode: import.meta.env.VITE_REACT_vnp_TmnCode,
    // vnp_HashSecret: import.meta.env.VITE_REACT_vnp_HashSecret,
    // vnp_Url: import.meta.env.VITE_REACT_vnp_Url,
    vnp_TmnCode: "RSRU7CDQ",
    vnp_HashSecret: "0ADS9PK4TONFW8U9N3SDOEV8CUU6RW0U",
    vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
};
