/// <reference path="jquery.d.ts" />
/// <reference path="jquery.chatjs.adapter.ts" />

class QorChatAdapterConstants {
    // Id of the current user (you)
    public static CURRENT_USER_ID: number = 1;
    // Id of the other user (Echobot)
    public static ECHOBOT_USER_ID:number = 2;
    // Id of the default room
    public static DEFAULT_ROOM_ID:number = 1;
    // time until Echobot starts typing
    public static ECHOBOT_TYPING_DELAY = 1000;
    // time until Echobot sends the message back
    public static ECHOBOT_REPLY_DELAY = 3000;

//    public static CHAT_SERVER_BASE_HTTP_URL = "https://chat_server.qortex.theplant-dev.com";
    public static CHAT_SERVER_BASE_HTTP_URL = "https://chatserver-qortex.theplant-dev.com";
    public static CHAT_SERVER_BASE_WS_URL = "wss://chatserver-qortex.theplant-dev.com";

//    for local debugger
//    public static CHAT_SERVER_BASE_HTTP_URL = "http://localhost:3333";
//    public static CHAT_SERVER_BASE_WS_URL = "ws://localhost:3333";
}

class QueryConvOptions {
    constructor(){
        this.participantEmails = new Array<string>();
    }
    participantEmails: Array<string>;
}

class AddParticipantOptions {
    convId:string;
    participantIds:Array<string>;
}

class QorChatMessageOptions {
    convId: string;
    content: string;
    fromUserId: string;
    fromUserAvatar: string;
    receiverId: string;
}

class QorChatRosterAllDataPkg {
    constructor(){
        this.dType = "all";
        this.topic = "roster";
    }
    dType: string;
    topic: string;
}

class QorChatPrivateDataPkg {
    constructor(msg:QorChatMessageOptions){
        this.message = msg;
        this.dType = "private";
        this.topic = "messages";
    }
    message: QorChatMessageOptions;
    dType: string;
    topic: string;
}

class QorChatMeetingDataPkg {
    constructor(msg:QorChatMessageOptions){
        this.message = msg;
        this.dType = "group";
        this.topic = "messages";
    }
    message: QorChatMessageOptions;
    dType: string;
    topic: string;
}

class QorChatNotificationOptions {
    convId:string;
    inviter_email:string;
    new_added_user_emails: Array<string>;
}

class QorChatNotifyDataPkg {
    constructor(ntf:QorChatNotificationOptions){
        this.notification = ntf;
        this.dType = "add_users";
        this.topic = "notification";
    }
    notification: QorChatNotificationOptions;
    dType: string;
    topic: string;
}


class QorChatClientAdapter implements IClientAdapter {
    constructor(){
        this.messagesChangedHandlers = [];
        this.typingSignalReceivedHandlers = [];
        this.userListChangedHandlers = [];
    }

    // adds a handler to the messagesChanged event
    onMessagesChanged(handler: (message: ChatMessageInfo) => void): void {
        this.messagesChangedHandlers.push(handler);
    }

    // adds a handler to the typingSignalReceived event
    onTypingSignalReceived(handler: (typingSignal: ChatTypingSignalInfo) => void): void {
        this.typingSignalReceivedHandlers.push(handler);
    }

    // adds a handler to the userListChanged event
    onUserListChanged(handler: (userListData: ChatUserListChangedInfo) => void): void {
        this.userListChangedHandlers.push(handler);
    }

    triggerMessagesChanged(message:ChatMessageInfo):void {
        for (var i = 0; i < this.messagesChangedHandlers.length; i++)
            this.messagesChangedHandlers[i](message);
    }

    triggerTypingSignalReceived(typingSignal:ChatTypingSignalInfo):void {
        for (var i = 0; i < this.typingSignalReceivedHandlers.length; i++)
            this.typingSignalReceivedHandlers[i](typingSignal);
    }

    triggerUserListChanged(userListChangedInfo:ChatUserListChangedInfo):void {
        for (var i = 0; i < this.userListChangedHandlers.length; i++)
            this.userListChangedHandlers[i](userListChangedInfo);
    }

    // event handlers
    messagesChangedHandlers: Array<(message: ChatMessageInfo) => void>;
    typingSignalReceivedHandlers: Array<(typingSignal: ChatTypingSignalInfo) => void>;
    userListChangedHandlers: Array<(userListData: ChatUserListChangedInfo) => void>;
}

class QorChatServerAdapter implements IServerAdapter {
    constructor(clientAdapter: IClientAdapter, email: string, token:string) {

        this.clientAdapter = clientAdapter;

        // configuring users
        this.qorchatToken = token;

        // adds the users in the global user list
        this.accessable = this._setCurrentUserAndUserList(email);
        if(!this.accessable){
            return;
        }

        this.setupWsConn();

        var meeting1 = new ChatMeetingInfo();
        meeting1.Id = 1;
        meeting1.Name = "Winter Dog";

        var meeting2 = new ChatMeetingInfo();
        meeting2.Id = 3;
        meeting2.Name = "Summer Cat";

        var meeting3 = new ChatMeetingInfo();
        meeting3.Id = 5;
        meeting3.Name = "Super Mario";

        // adds meetings in the global meeting list
        // list of users
        this.meetings = new Array<ChatMeetingInfo>();
        this.meetings.push(meeting1);
        this.meetings.push(meeting2);
        this.meetings.push(meeting3);


        // configuring rooms
        var defaultRoom = new ChatRoomInfo();
        defaultRoom.Id = 1;
        defaultRoom.Name = "Default Room";
        defaultRoom.UsersOnline = this.users.length;

        this.rooms = new Array<ChatRoomInfo>();
        this.rooms.push(defaultRoom);

        // configuring client to return every event to me
        this.clientAdapter.onMessagesChanged( (message:ChatMessageInfo) => function(){
        });
    }

    setupWsConn(){
        var self = this;
        this.conn = new WebSocket(
                QorChatAdapterConstants.CHAT_SERVER_BASE_WS_URL + "/ws/theplant/" + self.qorchatToken
        );

        this.conn.onopen = (evt: any) => {
            var data = new QorChatRosterAllDataPkg();
            var jsonStr = JSON.stringify(data);
            this.conn.send(jsonStr)
        }

        this.conn.onerror = (evt: ErrorEvent) => {
            console.log("ws errorr");
            console.log(evt);
        }

        this.conn.onclose = (evt: CloseEvent) => {
            var reconnectTime = Math.floor(Math.random() * 10001) + 3000;
            setTimeout(function () {
                console.log("reconnect ws");
                self.setupWsConn();
            }, reconnectTime);
        }

        this.conn.onmessage = (evt: any) => {
            var data = JSON.parse(evt.data);
            if(!data) {
                return;
            }

            if(data.topic == "roster") {
                var onlineUsers = data.object;
                var users = self.users;
                if(data.dType == "all") {
                    for(var j = 0; j < onlineUsers.length; j++){
                        for(var i = 0; i < users.length; i++){
                            if(onlineUsers[j].id == users[i].Id){
                                self.users[i].Status = UserStatusType.Online;
                                break;
                            }
                        }
                    }
                }else if(data.dType == "online") {
                    for(var i = 0; i < users.length; i++){
                        if(data.object.id == users[i].Id){
                            self.users[i].Status = UserStatusType.Online;
                            break;
                        }
                    }
                } else if (data.dType == "offline") {
                    for(var i = 0; i < users.length; i++){
                        if(data.object.id == users[i].Id){
                            self.users[i].Status = UserStatusType.Offline;
                            break;
                        }
                    }
                }

                self.enterRoom(QorChatAdapterConstants.DEFAULT_ROOM_ID, () => {
                });
            }

            if(data.topic == "messages"){

                var msg =  new ChatMessageInfo();
                msg.UserFromId = data.message.fromUserId;
                if(data.dType == "private"){
                    msg.UserToId = data.message.receiverId;
                } else if(data.dType == "group") {
                    msg.ConversationId = data.message.convId;
                }

                msg.RoomId = QorChatAdapterConstants.DEFAULT_ROOM_ID;
                msg.Message = data.message.content;
                this.clientAdapter.triggerMessagesChanged(msg);
            }

            if(data.topic == "notification"){
                var inviter = this._getUserByEmail(data.notification.inviter_email);
                var invitees = this._getUserByEmails(data.notification.new_added_user_emails);
                var tips = inviter.Name + " added " + invitees[0].Name + " to this meeting";
                if(invitees.length > 1){
                    tips = inviter.Name + " added " + invitees.length.toString() + " people to this meeting";
                }
                var inviteeIds = new Array<number>();
                for(var i = 0; i<invitees.length; i++){
                    inviteeIds.push(invitees[i].Id);
                }

                var msg =  new ChatMessageInfo();
                msg.ConversationId = data.notification.convId;
                msg.UserFromId = inviter.Id;
                msg.RoomId = QorChatAdapterConstants.DEFAULT_ROOM_ID;
                msg.IsSystemMessage = true;
                msg.NewAddedUserIds = inviteeIds;
                msg.Message = tips
                this.clientAdapter.triggerMessagesChanged(msg);
            }
        };
    }

    sendMessage(roomId:number, conversationId:string, otherUserId:number, messageText:string, clientGuid:string, done:() => void):void {
        console.log(messageText);
        console.log("QorChatServerAdapter: sendMessage");

        var msg = new QorChatMessageOptions();
        msg.content = messageText;
        msg.fromUserId = this.currentUser.Id.toString();
        msg.fromUserAvatar = this.currentUser.ProfilePictureUrl;

        var jsonStr = "";
        if(conversationId){
            msg.convId = conversationId;
            msg.receiverId = conversationId;
            var data = new QorChatMeetingDataPkg(msg);
            jsonStr = JSON.stringify(data);
        }else{
            var emails = this._getPrivateConvEmails(otherUserId.toString())
            msg.convId = this._getConvByEmails(emails, true);
            msg.receiverId = otherUserId.toString();
            var data = new QorChatPrivateDataPkg(msg);
            jsonStr = JSON.stringify(data);
        }

        this.conn.send(jsonStr);
        console.log(jsonStr);
    }

    sendTypingSignal(roomId:number, conversationId:string, userToId:number, done:() => void):void {
        return;
        console.log("QorChatServerAdapter: sendTypingSignal");
    }

    getMessageHistory(roomId:number, conversationId:string, otherUserId:number, done:(p1:Array<ChatMessageInfo>)=>void):void {
        console.log("QorChatServerAdapter: getMessageHistory");

        if(!conversationId){ // private chat history
            var emails = this._getPrivateConvEmails(otherUserId.toString())
            conversationId = this._getConvByEmails(emails, true);
        }
        var msgs = this._getChatHistory(conversationId);
        done(msgs);
    }

    getUserInfo(userId:number, done:(p1:ChatUserInfo)=>void):void {
        console.log("QorChatServerAdapter: getUserInfo");
        if(!this.accessable){
            alert("maybe your email account was not ailable on demo.qortex.com @theplant org, contact yeer for solution:)");
            return;
        }
        console.log(userId);
        var user:ChatUserInfo = null;
        for (var i:number = 0; i < this.users.length; i++) {
            if (this.users[i].Id == userId) {
                user = this.users[i];
                break;
            }
        }
        if (user == null)
            throw "User doesn't exit. User id: " + userId;
        done(user);
    }

    getUserList(roomId:number, conversationId:string, done:(p1:Array<ChatUserInfo>)=>void):void {
        console.log("QorChatServerAdapter: getUserList");

        if(roomId == QorChatAdapterConstants.DEFAULT_ROOM_ID)
        {
            if(conversationId){
                console.log(conversationId)
                var users = this._getConvParticipants(conversationId);
                done(users);
                return;
            }

            done(this.users);
            return;
        }
        throw "The given room or conversation is not supported by the demo adapter";
    }



    getMeetingList(roomId:number, done:(p1:Array<ChatMeetingInfo>)=>void):void {
        console.log("QorChatServerAdapter: getMeetingList");
        if(roomId == QorChatAdapterConstants.DEFAULT_ROOM_ID)
        {
            done(this.meetings);
            return;
        }
        throw "The given room or conversation is not supported by the demo adapter";
    }

    enterRoom(roomId:number, done:()=>void):void {
        console.log("QorChatServerAdapter: enterRoom");
        if(!this.accessable){
            return;
        }

        if(roomId != QorChatAdapterConstants.DEFAULT_ROOM_ID)
            throw "Only the default room is supported in the demo adapter";

        var userListChangedInfo = new ChatUserListChangedInfo();
        userListChangedInfo.RoomId =QorChatAdapterConstants.DEFAULT_ROOM_ID;
        userListChangedInfo.UserList = this.users;

        this.clientAdapter.triggerUserListChanged(userListChangedInfo);
    }

    leaveRoom(roomId:number, done:()=>void):void {
        console.log("QorChatServerAdapter: leaveRoom");
    }

    addOneParticipant(convId:string, existUserIds:Array<string>, userId:string) :string{
        if(existUserIds.length > 2) {
            this._addParticipantToMeeting(convId, userId);
            return convId;
        }

        var emails = this._getMeetingConvEmails(existUserIds, userId);
        convId = this._getConvByEmails(emails, false);
        return convId
    }

    _getMeetingConvEmails(withUserIds:Array<string>, userId:string):Array<string>{
        var emails = new Array<string>();
        for(var i = 0; i < withUserIds.length; i++){
            var user = this._getUserById(withUserIds[i]);
            emails.push(user.Email);
        }
        var newUser = this._getUserById(userId);
        emails.push(newUser.Email);

        return emails;
    }

    _getPrivateConvEmails(toUserId:string):Array<string>{
        var emails = new Array<string>();
        var toUser = this._getUserById(toUserId);
        emails.push(this.currentUser.Email);
        emails.push(toUser.Email);
        return emails;
    }

    _setCurrentUserAndUserList(email:string):boolean {
        var self = this;
        self.users = new Array<ChatUserInfo>();
        $.ajax(QorChatAdapterConstants.CHAT_SERVER_BASE_HTTP_URL + "/teams/theplant/users", {
            async: false,
            type: 'get',
            headers: {Authorization: 'Bearer ' + self.qorchatToken},
            contentType: 'application/json',
            dataType: 'json',
            success: function (data) {
                var i = 0;
                while (i < data.length) {
                    var u = data[i];
                    var cui = new ChatUserInfo();
                    cui.Id = u.id;
                    cui.RoomId = QorChatAdapterConstants.DEFAULT_ROOM_ID;
                    cui.Name = u.name;
                    cui.Email = u.email;
                    cui.ProfilePictureUrl = u.avatar;
                    cui.Status = UserStatusType.Offline;
                    self.users.push(cui);
                    if(cui.Email == email){
                        self.currentUser = cui;
                    }
                    i++;
                }
            }
        })


        // sort contacts list
        this.users.sort(function(u1, u2){
            var a = u1.Name.toLowerCase();
            var b = u2.Name.toLowerCase();
            if(a>b){
                return 1;
            }
            if(a<b){
                return -1;
            }
            return 0;
        });

        return self.currentUser!=null
    }

    _addParticipantToMeeting(convId: string, newUserId:string) :void {
        var self = this;
        var ids = new Array<string>();
        ids.push(newUserId);
        var options = new AddParticipantOptions();
        options.convId = convId;
        options.participantIds = ids;

        $.ajax(QorChatAdapterConstants.CHAT_SERVER_BASE_HTTP_URL + "/teams/theplant/conversations/add_participants", {
            async: false,
            type: 'post',
            headers: {Authorization: 'Bearer ' + self.qorchatToken},
            contentType: 'application/json',
            data: JSON.stringify(options),
            dataType: 'json',
            success: function (data) {
                if(data.Success){
                    var newUser = self._getUserById(newUserId);
                    self._notifyUserAdded(convId, newUser.Email);
                }
            }
        })
    }

    _notifyUserAdded(convId:string, newUserEmail:string){
        var ntf = new QorChatNotificationOptions();
        ntf.convId = convId;
        ntf.inviter_email = this.currentUser.Email;
        var emails = new Array<string>();
        emails.push(newUserEmail)
        ntf.new_added_user_emails = emails;

        var data = new QorChatNotifyDataPkg(ntf);
        var jsonStr = JSON.stringify(data);
        this.conn.send(jsonStr)
    }

    _getConvParticipants(convId:string):Array<ChatUserInfo>{
        var users = new Array<ChatUserInfo>();

        var self = this;
        $.ajax(QorChatAdapterConstants.CHAT_SERVER_BASE_HTTP_URL + "/teams/theplant/conversations/" + convId, {
            async: false,
            type: 'get',
            headers: {Authorization: 'Bearer ' + self.qorchatToken},
            contentType: 'application/json',
            dataType: 'json',
            success: function (data) {
                users =self._getUsersByIds(data.participantIds)
            }
        })
        return users;
    }

    _getConvByEmails(emails: Array<string>, useCache:boolean) {
        var self = this;
        var convId = "";
        var options = new QueryConvOptions();

        options.participantEmails = emails.sort();


        var emailsStr = options.participantEmails.join("-");

        var key = "qorchat-conv-key-" + emailsStr;
        var id = window.localStorage.getItem(key);
        if(useCache&&id){
            convId = id;
            return convId;
        }

        $.ajax(QorChatAdapterConstants.CHAT_SERVER_BASE_HTTP_URL + "/teams/theplant/conversations", {
            async: false,
            type: 'post',
            data: JSON.stringify(options),
            headers: {
                Authorization: 'Bearer ' + self.qorchatToken,
            },
            contentType: 'application/json',
            dataType: 'json',
            success: function (data) {
                convId = data.id;
            }
        })

        if(useCache){
            window.localStorage.setItem(key, convId);
        }
        return convId;
    }

    _getChatHistory(convId:string) :Array<ChatMessageInfo>{
        var self = this;
        var msgs = new Array<ChatMessageInfo>();

        var url = QorChatAdapterConstants.CHAT_SERVER_BASE_HTTP_URL + "/teams/theplant/messages?convId=" + convId + "&before=&limit=5";
        $.ajax(url, {
            async: false,
            type: 'get',
            headers: {
                Authorization: 'Bearer ' + self.qorchatToken,
            },
            contentType: 'application/json',
            dataType: 'json',
            success: function (data) {
                if(!data){
                    return;
                }

                for(var i = 0; i < data.length; i++){
                    var msg = new ChatMessageInfo();
                    msg.ConversationId = convId;
                    msg.RoomId = QorChatAdapterConstants.DEFAULT_ROOM_ID;
                    var generateGuidPart = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
                    var clientGuid = (generateGuidPart() + generateGuidPart() + '-' + generateGuidPart() + '-' + generateGuidPart() + '-' + generateGuidPart() + '-' + generateGuidPart() + generateGuidPart() + generateGuidPart());
                    msg.ClientGuid = clientGuid;
                    msg.UserFromId = data[i].fromUserId;
                    msg.UserToId = self.currentUser.Id;
                    msg.Message = data[i].content;
                    msgs.unshift(msg);
                }
            }
        })

        return msgs;
    }



    // gets the given user from the user list
    _getUserById(userId: string):ChatUserInfo {
        for(var i = 0; i < this.users.length ;i++)
        {
            if(this.users[i].Id.toString() == userId)
            return this.users[i];
        }
        throw "Could not find the given user";
    }



    _getUsersByIds(userIds: Array<string>):Array<ChatUserInfo> {
        var users = new Array<ChatUserInfo>();;
        for(var i = 0; i < this.users.length ;i++) {
            if (userIds.indexOf(this.users[i].Id.toString()) != -1) {
                users.push(this.users[i]);
            }
        }
        return users;
    }

    _getUserByEmail(email: string):ChatUserInfo {
        for(var i = 0; i < this.users.length ;i++)
        {
            if(this.users[i].Email == email)
                return this.users[i];
        }
        throw "Could not find the given user";
    }

    _getUserByEmails(emails: Array<string>):Array<ChatUserInfo> {
        var users = new Array<ChatUserInfo>();
        for(var i = 0; i < this.users.length ;i++)
        {
            if(emails.indexOf(this.users[i].Email) != -1){
                users.push(this.users[i]);
            }
        }
        return users;
    }

    // the client adapter
    clientAdapter: IClientAdapter;

    // list of meetings
    meetings:Array<ChatMeetingInfo>;

    // list of users
    users:Array<ChatUserInfo>;

    // list of rooms
    rooms:Array<ChatRoomInfo>;

    conn: WebSocket;

    qorchatToken: string;
    currentUser: ChatUserInfo;
    accessable: boolean;
}

class QorChatAdapter implements IAdapter {
    constructor(email: string) {
        // TODO remove hardcode
        if (!email) {
            //Local debug
            email = "athom@126.com"
//            email = "yeerkunth@gmail.com"
//            email = "venustingting@gmail.com"
        }

        this.email = email;
        this.qorchatToken = this.currentUserAccessToken();
        this.loadCurrentUserId();
    }
    // called when the adapter is initialized
    init(done:(currentUserId:number) => void):void {
        if(!this.currentUser){
            return;
        }
        this.client = new QorChatClientAdapter();
        this.server = new QorChatServerAdapter(this.client, this.email, this.qorchatToken);
        done(this.currentUser.Id);
    }

    loadCurrentUserId() {
        var userId = 0;
        var self = this;
        $.ajax(QorChatAdapterConstants.CHAT_SERVER_BASE_HTTP_URL + "/users/my-account", {
            async: false,
            type: 'get',
            headers: {Authorization: 'Bearer ' + self.qorchatToken},
            contentType: 'application/json',
            dataType: 'json',
            success: function (u) {
                var user = new ChatUserInfo();
                user.Id = u.id;
                user.RoomId = QorChatAdapterConstants.DEFAULT_ROOM_ID;
                user.Name = u.name;
                user.Email = u.email;
                user.ProfilePictureUrl = u.avatar;
                user.Status = UserStatusType.Offline;
                self.currentUser = user;
            }
        })
    }

    currentUserAccessToken() :string{
        var token = "";
        var self = this;
        $.ajax(QorChatAdapterConstants.CHAT_SERVER_BASE_HTTP_URL + "/fetch_chat_token", {
            async: false,
            type: 'get',
            data: {email: this.email},
            contentType: 'application/json',
            dataType: 'json',
            success: function (data) {
                token = data;
            }
        })
        return token
    }

    // functions called by the server, to contact the client
    client:IClientAdapter;

    // functions called by the client, to contact the server
    server:IServerAdapter;

    email: string;
    qorchatToken: string;
    currentUser: ChatUserInfo;
}
