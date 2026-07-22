import { Injectable } from "@nestjs/common";
import { AExtensionService, ExtensionFunction, ExtensionService, logWrapper, SubscribableEvent, MessagesService } from "@ivy-eco/sdk";
import { AternosManager } from "./pages";

@Injectable()
@ExtensionService([
    { name: "username", input: "input-text" },
    { name: "password", input: "input-password" }
])
export class AternosService extends AExtensionService {
    constructor(private messagesS: MessagesService) {
        super();
    }

    get endpoint(): string {
        return "minecraft";
    }

    get events(): SubscribableEvent[]{
        return ["message.received"];
    }

    async commandNotFound(body, command: string): Promise<void> {
        this.reportMessage2(body, undefined, `${command} is not a command for this extension. 🫵🤣`)
    }

    async reportMessage2(body,  messageId, log) {
        const { data: dataReceived, sessionId } = body;
        const { chatId } = dataReceived;

        console.log(log);
        let finalLog = logWrapper(log, { starting: "*Ivy*\n─────────────────────" });

        if(!messageId){
            const { data: dataSend } = await this.messagesS.sendMessage(sessionId, {
                chatId,
                text: finalLog
            }) as { data: { messageId:string } };

            messageId = dataSend.messageId;
        } else {
            const { data: dataEdit } = await this.messagesS.editMessage(sessionId, {
                messageId,
                chatId,
                text: finalLog,
            });

            messageId = dataEdit.messageId;
        }

        return messageId;
    }

    async reportMessage(log, messageId, chatId, sessionId) {
        console.log(log);
        let finalLog = logWrapper(log, { starting: "🍃 *Ivy*\n─────────────────────" });

        if(!messageId){
            const { data: dataSend } = await this.messagesS.sendMessage(sessionId, {
                chatId,
                text: finalLog
            }) as { data: { messageId:string } };

            messageId = dataSend.messageId;
        } else {
            const { data: dataEdit } = await this.messagesS.editMessage(sessionId, {
                messageId,
                chatId,
                text: finalLog,
            });

            messageId = dataEdit.messageId;
        }

        return messageId;
    }

    @ExtensionFunction('status')
    async getStatus(body, _, values: { username: string, password: string }) {
        const { data: dataReceived, sessionId } = body;
        const { chatId } = dataReceived;

        let messageId;

        AternosManager.checkServerStatus(
            values.username, 
            values.password,  
            async (log) => {
                messageId = await this.reportMessage(log, messageId, chatId, sessionId);
                return log;
            },
            async () => console.log("Done"),
            async (text) => {
                await this.messagesS.sendMessage(sessionId, {
                    chatId,
                    text
                })
            }
        );

        return { success: false }
    }

    @ExtensionFunction('start')
    async startServer(body, _, values: { username: string, password: string }) {
        const { data: dataReceived, sessionId } = body;
        const { chatId } = dataReceived;

        let messageId;
        
        AternosManager.startServer(
            values.username, 
            values.password,  
             async (log) => {
                messageId = await this.reportMessage(log, messageId, chatId, sessionId);
                return log;
            },
            async () => console.log("Done"),
            async (text) => {
                await this.messagesS.sendMessage(sessionId, {
                    chatId,
                    text
                })
            }
        )
        
        return { success: false }
    }

    @ExtensionFunction('players')
    async showPlayers(body, _, values: { username: string, password: string }) {
        const { data: dataReceived, sessionId } = body;
        const { chatId } = dataReceived;

        let messageId;
        
        AternosManager.checkPlayers(
            values.username, 
            values.password,  
             async (log) => {
                messageId = await this.reportMessage(log, messageId, chatId, sessionId);
                return log;
            },
            async () => console.log("Done"),
            async (text) => {
                await this.messagesS.sendMessage(sessionId, {
                    chatId,
                    text
                })
            }
        )
        
        return { success: false }
    }

    @ExtensionFunction("help")
    async help(body){
        const { data: dataReceived, sessionId } = body;
        const { chatId } = dataReceived;

        await this.reportMessage("* `/mc start`\n* `/mc status`\n* `/mc players`", undefined, chatId, sessionId);

        return { success: true }
    }
}