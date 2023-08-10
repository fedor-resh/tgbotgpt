import {Configuration, OpenAIApi} from 'openai'
import {createReadStream} from 'fs'
import {openai} from "./main.js";
import {streamDebounce} from "./utils.js";

export class OpenAI {
    roles = {
        ASSISTANT: 'assistant',
        USER: 'user',
        SYSTEM: 'system',
    }

    constructor(apiKey) {
        const configuration = new Configuration({
            apiKey,
        })
        this.openai = new OpenAIApi(configuration)
    }

    async chat(messages) {
        try {
            const response = await this.openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages,
            })
            return response.data.choices[0].message
        } catch (e) {
            console.log('Error while gpt chat', e.message)
        }
    }

    async chatStream(messages) {
        try {
            return await this.openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages,
                stream: true,
            }, {responseType: 'stream'})
        } catch (e) {
            console.log('Error while gpt chat', e.message)
        }
    }

    async updateWhileChatStream(messages, callback) {
        try {
            const res = await this.chatStream(messages)
            let text = ''
            res.data.on('data', data => {
                const lines = data.toString().split('\n').filter(line => line.trim() !== '');
                for (const line of lines) {
                    const message = line.replace(/^data: /, '');
                    if (message === '[DONE]') {
                        callback(text, true)
                        messages.push({
                            role: openai.roles.ASSISTANT,
                            content: text,
                        })
                        return; // Stream finished
                    }
                    try {
                        const parsed = JSON.parse(message);
                        const add = parsed.choices[0].delta.content
                        if(add) {
                            text += add
                            if(streamDebounce()) callback(text+'...')
                        }
                    } catch (error) {
                        console.error('Could not JSON parse stream message', message, error);
                    }
                }
            });

        } catch (error) {
            if (error.response?.status) {
                console.error(error.response.status, error.message);
                error.response.data.on('data', data => {
                    const message = data.toString();
                    try {
                        const parsed = JSON.parse(message);
                        console.error('An error occurred during OpenAI request: ', parsed);
                    } catch (error) {
                        console.error('An error occurred during OpenAI request: ', message);
                    }
                });
            } else {
                console.error('An error occurred during OpenAI request', error);
            }
        }

    }

    async transcription(filepath) {
        try {
            const response = await this.openai.createTranscription(
                createReadStream(filepath),
                'whisper-1'
            )
            return response.data.text
        } catch (e) {
            console.log('Error while transcription', e.message)
        }
    }

    async createImage(description) {
        try {
            const response = await this.openai.createImage({
                prompt: description,
                n: 2,
                size: "1024x1024",
            });
            return response.data.data
        } catch (e) {
            console.log('Error while create image', e.message)
        }
    }
}

