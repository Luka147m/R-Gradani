import OpenAI from "openai";

export function handleOpenAIError(error: unknown) {
    if (error instanceof OpenAI.APIError) {
        return {
            success: false,
            openai: true,
            status: error.status,
            code: error.code,
            type: error.type,
            message: error.message,
        };
    }

    if (error instanceof Error) {
        return {
            success: false,
            openai: false,
            message: error.message,
        };
    }

    return {
        success: false,
        message: "Unknown error",
    };
}
