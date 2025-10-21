export class X402Error extends Error {
    constructor(message: string, public type: string) {
        super(message);
        this.name = "X402Error";
    }

    static missingConfig(field: string): X402Error {
        return new X402Error(`Missing required config field: ${field}`, "MissingConfig");
    }

    static paymentSetup(message: string): X402Error {
        return new X402Error(`Payment setup error: ${message}`, "PaymentSetup");
    }

    static request(message: string): X402Error {
        return new X402Error(`Request error: ${message}`, "Request");
    }

    static response(message: string): X402Error {
        return new X402Error(`Response error: ${message}`, "Response");
    }

    static parse(message: string): X402Error {
        return new X402Error(`Parse error: ${message}`, "Parse");
    }
}
