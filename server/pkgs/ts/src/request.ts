import { ApiRequest, HttpMethod } from "./types";

export class ApiRequestBuilder {
    private request: ApiRequest;

    constructor(method: HttpMethod, path: string) {
        this.request = {
            method,
            path,
            headers: {
                "Content-Type": "application/json",
            },
        };
    }

    static get(path: string): ApiRequestBuilder {
        return new ApiRequestBuilder(HttpMethod.GET, path);
    }

    static post(path: string): ApiRequestBuilder {
        return new ApiRequestBuilder(HttpMethod.POST, path);
    }

    static put(path: string): ApiRequestBuilder {
        return new ApiRequestBuilder(HttpMethod.PUT, path);
    }

    static delete(path: string): ApiRequestBuilder {
        return new ApiRequestBuilder(HttpMethod.DELETE, path);
    }

    static patch(path: string): ApiRequestBuilder {
        return new ApiRequestBuilder(HttpMethod.PATCH, path);
    }

    withHeader(key: string, value: string): ApiRequestBuilder {
        this.request.headers = this.request.headers || {};
        this.request.headers[key] = value;
        return this;
    }

    withHeaders(headers: Record<string, string>): ApiRequestBuilder {
        this.request.headers = {
            ...this.request.headers,
            ...headers,
        };
        return this;
    }

    withBody(body: any): ApiRequestBuilder {
        this.request.body = body;
        return this;
    }

    build(): ApiRequest {
        return this.request;
    }
}