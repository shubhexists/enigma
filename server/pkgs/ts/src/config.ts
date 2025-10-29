import { X402Error } from "./errors";
import { X402Config } from "./types";

export class X402ConfigBuilder {
    private config: Partial<X402Config> = {};

    baseUrl(url: string): X402ConfigBuilder {
        this.config.baseUrl = url;
        return this;
    }

    userId(id: string): X402ConfigBuilder {
        this.config.userId = id;
        return this;
    }

    apiId(id: string): X402ConfigBuilder {
        this.config.apiId = id;
        return this;
    }

    solanaRpcUrl(url: string): X402ConfigBuilder {
        this.config.solanaRpcUrl = url;
        return this;
    }

    network(network: string): X402ConfigBuilder {
        this.config.network = network;
        return this;
    }

    maxPaymentAmount(amount: number): X402ConfigBuilder {
        this.config.maxPaymentAmount = amount;
        return this;
    }

    build(): Required<X402Config> {
        if (!this.config.userId) {
            throw X402Error.missingConfig("userId");
        }
        if (!this.config.apiId) {
            throw X402Error.missingConfig("apiId");
        }

        return {
            baseUrl: this.config.baseUrl || "http://localhost:3000",
            userId: this.config.userId,
            apiId: this.config.apiId,
            solanaRpcUrl: this.config.solanaRpcUrl || "https://api.devnet.solana.com",
            network: this.config.network || "solana-devnet",
            maxPaymentAmount: this.config.maxPaymentAmount ?? 0.1,
        };
    }
}
