import { createSigner, wrapFetchWithPayment } from "x402-fetch";
import { ApiRequest, ApiResponse, X402Config } from "./types";
import { ApiRequestBuilder } from "./request";
import { X402Error } from "./errors";
import { X402ConfigBuilder } from "./config";

export class X402Client {
    private config: Required<X402Config>;
    private fetchWithPayment: typeof fetch;

    private constructor(config: Required<X402Config>, fetchWithPayment: typeof fetch) {
        this.config = config;
        this.fetchWithPayment = fetchWithPayment;
    }

    static async create(privateKey: string, config: X402Config): Promise<X402Client> {
        const fullConfig = new X402ConfigBuilder()
            .baseUrl(config.baseUrl || "http://localhost:3000")
            .userId(config.userId)
            .apiId(config.apiId)
            .solanaRpcUrl(config.solanaRpcUrl || "https://api.devnet.solana.com")
            .network(config.network || "solana-devnet")
            .maxPaymentAmount(config.maxPaymentAmount ?? 0.1)
            .build();

        try {
            const signer = await createSigner(fullConfig.network as any, privateKey);
            const fetchWithPayment = wrapFetchWithPayment(fetch, signer) as typeof fetch;
            return new X402Client(fullConfig, fetchWithPayment);
        } catch (error) {
            throw X402Error.paymentSetup((error as Error).message);
        }
    }

    private getEndpointUrl(): string {
        return `${this.config.baseUrl}/users/${this.config.userId}/apis/${this.config.apiId}`;
    }

    async execute(request: ApiRequest): Promise<ApiResponse> {
        try {
            const body = JSON.stringify({
                method: request.method,
                path: request.path,
                headers: request.headers || {},
                body: request.body,
            });

            const response = await this.fetchWithPayment(this.getEndpointUrl(), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body,
            });

            const text = await response.text();

            return {
                status: response.status,
                body: text,
            };
        } catch (error) {
            throw X402Error.request((error as Error).message);
        }
    }

    async get(path: string): Promise<ApiResponse> {
        const request = ApiRequestBuilder.get(path).build();
        return this.execute(request);
    }

    async post(path: string, body?: any): Promise<ApiResponse> {
        const request = ApiRequestBuilder.post(path).withBody(body).build();
        return this.execute(request);
    }

    async put(path: string, body?: any): Promise<ApiResponse> {
        const request = ApiRequestBuilder.put(path).withBody(body).build();
        return this.execute(request);
    }

    async delete(path: string): Promise<ApiResponse> {
        const request = ApiRequestBuilder.delete(path).build();
        return this.execute(request);
    }

    async patch(path: string, body?: any): Promise<ApiResponse> {
        const request = ApiRequestBuilder.patch(path).withBody(body).build();
        return this.execute(request);
    }
}
