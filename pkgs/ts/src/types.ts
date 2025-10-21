export enum HttpMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
    PATCH = "PATCH",
    HEAD = "HEAD",
    OPTIONS = "OPTIONS",
}

export interface ApiRequest {
    method: HttpMethod;
    path: string;
    headers?: Record<string, string>;
    body?: any;
}

export interface ApiResponse {
    status: number;
    body: string;
}

export interface X402Config {
    baseUrl?: string;
    userId: string;
    apiId: string;
    solanaRpcUrl?: string;
    network?: string;
    maxPaymentAmount?: number;
}