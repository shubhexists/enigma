import { X402Error } from "./errors";
import { ApiResponse } from "./types";

export class X402Response implements ApiResponse {
    constructor(public status: number, public body: string) { }

    json<T = any>(): T {
        try {
            return JSON.parse(this.body);
        } catch (error) {
            throw X402Error.parse((error as Error).message);
        }
    }

    isSuccess(): boolean {
        return this.status >= 200 && this.status < 300;
    }
}