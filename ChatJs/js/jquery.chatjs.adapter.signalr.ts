/// <reference path="jquery.d.ts"/>
/ <reference path="../../Scripts/Typings/signalr/signalr.d.ts"/>
/// <reference path="jquery.chatjs.adapter.servertypes.ts"/>
/// <reference path="jquery.chatjs.adapter.ts"/>


interface IChatJsHubProxyClient {
    sendMessage: (message: ChatMessageInfo) => void;
    sendTypingSignal: (typingSignal: ChatTypingSignalInfo) => void;
    userListChanged: (userListChangedInfo: ChatUserListChangedInfo) => void
    roomListChanged: (roomListChangedInfo: ChatRoomListChangedInfo) => void
}

interface IChatJsHubProxyServer {
    sendMessage: (roomId: number, conversationId: number, otherUserId: number, messageText: string, clientGuid: string) => JQueryPromise<any>;
    sendTypingSignal: (roomId: number, conversationId: number, userToId: number) => JQueryPromise<any>;
    getMessageHistory: (roomId: number, conversationId: string, otherUserId: number) => JQueryPromise<any>;
    getUserInfo: (userId: number) => JQueryPromise<any>;
    getUserList: (roomId: number, conversationId: number) => JQueryPromise<any>;
    enterRoom: (roomId: number) => JQueryPromise<any>;
    leaveRoom: (roomId: number) => JQueryPromise<any>;
    getRoomsList(): JQueryPromise<any>;
}

interface IChatJsHubProxy {
    client: IChatJsHubProxyClient;
    server: IChatJsHubProxyServer;
}

interface SignalR {
    chatHub: IChatJsHubProxy;
}

interface Window {
    chatJsHubReady: JQueryPromise<any>;
}


class SignalRServerAdapter implements IServerAdapter {
}

class SignalRClientAdapter implements IClientAdapter {
}

class SignalRAdapterOptions {
    // the name of the ChatJS SignalR hub in the server. Default is chatHub
}

class SignalRAdapter implements IAdapter {

//    constructor(options: SignalRAdapterOptions) {
//        var defaultOptions = new SignalRAdapterOptions();
//        defaultOptions.chatHubName = "chatHub";
//        this.options = $.extend({}, defaultOptions, options);
//    }
//
//    init(done: () => void) {
//        this.hub = <IChatJsHubProxy> $.connection[this.options.chatHubName];
//        this.client = new SignalRClientAdapter(this.hub.client);
//        this.server = new SignalRServerAdapter(this.hub.server);
//
//        if (!window.chatJsHubReady)
//            window.chatJsHubReady = $.connection.hub.start();
//
//        window.chatJsHubReady.done(() => {
//            // function passed by ChatJS to the adapter to be called when the adapter initialization is completed
//            done();
//        });
//    }
//
//    // functions called by the server, to contact the client
//    client: IClientAdapter;
//
//    // functions called by the client, to contact the server
//    server: IServerAdapter;
//    hub: IChatJsHubProxy;
//    options: SignalRAdapterOptions;
}