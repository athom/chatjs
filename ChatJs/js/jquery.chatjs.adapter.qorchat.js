/// <reference path="jquery.d.ts" />
/// <reference path="jquery.chatjs.adapter.ts" />
var QorChatAdapterConstants = (function () {
    function QorChatAdapterConstants() {
    }
    // Id of the current user (you)
    QorChatAdapterConstants.CURRENT_USER_ID = 1;
    // Id of the other user (Echobot)
    QorChatAdapterConstants.ECHOBOT_USER_ID = 2;
    // Id of the default room
    QorChatAdapterConstants.DEFAULT_ROOM_ID = 1;
    // time until Echobot starts typing
    QorChatAdapterConstants.ECHOBOT_TYPING_DELAY = 1000;
    // time until Echobot sends the message back
    QorChatAdapterConstants.ECHOBOT_REPLY_DELAY = 3000;
    QorChatAdapterConstants.CHAT_SERVER_BASE_HTTP_URL = "http://chat_server.qortex.theplant-dev.com";
    QorChatAdapterConstants.CHAT_SERVER_BASE_WS_URL = "ws://chat_server.qortex.theplant-dev.com";
    return QorChatAdapterConstants;
})();
var QueryConvOptions = (function () {
    function QueryConvOptions() {
        this.participantEmails = new Array();
    }
    return QueryConvOptions;
})();
var AddParticipantOptions = (function () {
    function AddParticipantOptions() {
    }
    return AddParticipantOptions;
})();
var QorChatMessageOptions = (function () {
    function QorChatMessageOptions() {
    }
    return QorChatMessageOptions;
})();
var QorChatRosterAllDataPkg = (function () {
    function QorChatRosterAllDataPkg() {
        this.dType = "all";
        this.topic = "roster";
    }
    return QorChatRosterAllDataPkg;
})();
var QorChatPrivateDataPkg = (function () {
    function QorChatPrivateDataPkg(msg) {
        this.message = msg;
        this.dType = "private";
        this.topic = "messages";
    }
    return QorChatPrivateDataPkg;
})();
var QorChatMeetingDataPkg = (function () {
    function QorChatMeetingDataPkg(msg) {
        this.message = msg;
        this.dType = "group";
        this.topic = "messages";
    }
    return QorChatMeetingDataPkg;
})();
var QorChatNotificationOptions = (function () {
    function QorChatNotificationOptions() {
    }
    return QorChatNotificationOptions;
})();
var QorChatNotifyDataPkg = (function () {
    function QorChatNotifyDataPkg(ntf) {
        this.notification = ntf;
        this.dType = "add_users";
        this.topic = "notification";
    }
    return QorChatNotifyDataPkg;
})();
var QorChatClientAdapter = (function () {
    function QorChatClientAdapter() {
        this.messagesChangedHandlers = [];
        this.typingSignalReceivedHandlers = [];
        this.userListChangedHandlers = [];
    }
    // adds a handler to the messagesChanged event
    QorChatClientAdapter.prototype.onMessagesChanged = function (handler) {
        this.messagesChangedHandlers.push(handler);
    };
    // adds a handler to the typingSignalReceived event
    QorChatClientAdapter.prototype.onTypingSignalReceived = function (handler) {
        this.typingSignalReceivedHandlers.push(handler);
    };
    // adds a handler to the userListChanged event
    QorChatClientAdapter.prototype.onUserListChanged = function (handler) {
        this.userListChangedHandlers.push(handler);
    };
    QorChatClientAdapter.prototype.triggerMessagesChanged = function (message) {
        for (var i = 0; i < this.messagesChangedHandlers.length; i++)
            this.messagesChangedHandlers[i](message);
    };
    QorChatClientAdapter.prototype.triggerTypingSignalReceived = function (typingSignal) {
        for (var i = 0; i < this.typingSignalReceivedHandlers.length; i++)
            this.typingSignalReceivedHandlers[i](typingSignal);
    };
    QorChatClientAdapter.prototype.triggerUserListChanged = function (userListChangedInfo) {
        for (var i = 0; i < this.userListChangedHandlers.length; i++)
            this.userListChangedHandlers[i](userListChangedInfo);
    };
    return QorChatClientAdapter;
})();
var QorChatServerAdapter = (function () {
    function QorChatServerAdapter(clientAdapter, email, token) {
        this.clientAdapter = clientAdapter;
        // configuring users
        this.qorchatToken = token;
        // adds the users in the global user list
        this.accessable = this._setCurrentUserAndUserList(email);
        if (!this.accessable) {
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
        this.meetings = new Array();
        this.meetings.push(meeting1);
        this.meetings.push(meeting2);
        this.meetings.push(meeting3);
        // configuring rooms
        var defaultRoom = new ChatRoomInfo();
        defaultRoom.Id = 1;
        defaultRoom.Name = "Default Room";
        defaultRoom.UsersOnline = this.users.length;
        this.rooms = new Array();
        this.rooms.push(defaultRoom);
        // configuring client to return every event to me
        this.clientAdapter.onMessagesChanged(function (message) { return function () {
        }; });
    }
    QorChatServerAdapter.prototype.setupWsConn = function () {
        var _this = this;
        var self = this;
        this.conn = new WebSocket(QorChatAdapterConstants.CHAT_SERVER_BASE_WS_URL + "/ws/theplant/" + self.qorchatToken);
        this.conn.onopen = function (evt) {
            var data = new QorChatRosterAllDataPkg();
            var jsonStr = JSON.stringify(data);
            _this.conn.send(jsonStr);
        };
        this.conn.onerror = function (evt) {
            console.log("ws errorr");
            console.log(evt);
        };
        this.conn.onclose = function (evt) {
            var reconnectTime = Math.floor(Math.random() * 10001) + 3000;
            setTimeout(function () {
                console.log("reconnect ws");
                self.setupWsConn();
            }, reconnectTime);
        };
        this.conn.onmessage = function (evt) {
            var data = JSON.parse(evt.data);
            if (!data) {
                return;
            }
            if (data.topic == "roster") {
                var onlineUsers = data.object;
                var users = self.users;
                if (data.dType == "all") {
                    for (var j = 0; j < onlineUsers.length; j++) {
                        for (var i = 0; i < users.length; i++) {
                            if (onlineUsers[j].id == users[i].Id) {
                                self.users[i].Status = 1 /* Online */;
                                break;
                            }
                        }
                    }
                }
                else if (data.dType == "online") {
                    for (var i = 0; i < users.length; i++) {
                        if (data.object.id == users[i].Id) {
                            self.users[i].Status = 1 /* Online */;
                            break;
                        }
                    }
                }
                else if (data.dType == "offline") {
                    for (var i = 0; i < users.length; i++) {
                        if (data.object.id == users[i].Id) {
                            self.users[i].Status = 0 /* Offline */;
                            break;
                        }
                    }
                }
                self.enterRoom(QorChatAdapterConstants.DEFAULT_ROOM_ID, function () {
                });
            }
            if (data.topic == "messages") {
                var msg = new ChatMessageInfo();
                msg.UserFromId = data.message.fromUserId;
                if (data.dType == "private") {
                    msg.UserToId = data.message.receiverId;
                }
                else if (data.dType == "group") {
                    msg.ConversationId = data.message.convId;
                }
                msg.RoomId = QorChatAdapterConstants.DEFAULT_ROOM_ID;
                msg.Message = data.message.content;
                _this.clientAdapter.triggerMessagesChanged(msg);
            }
            if (data.topic == "notification") {
                var inviter = _this._getUserByEmail(data.notification.inviter_email);
                var invitees = _this._getUserByEmails(data.notification.new_added_user_emails);
                var tips = inviter.Name + " added " + invitees[0].Name + " to this meeting";
                if (invitees.length > 1) {
                    tips = inviter.Name + " added " + invitees.length.toString() + " people to this meeting";
                }
                var inviteeIds = new Array();
                for (var i = 0; i < invitees.length; i++) {
                    inviteeIds.push(invitees[i].Id);
                }
                var msg = new ChatMessageInfo();
                msg.ConversationId = data.notification.convId;
                msg.UserFromId = inviter.Id;
                msg.RoomId = QorChatAdapterConstants.DEFAULT_ROOM_ID;
                msg.IsSystemMessage = true;
                msg.NewAddedUserIds = inviteeIds;
                msg.Message = tips;
                _this.clientAdapter.triggerMessagesChanged(msg);
            }
        };
    };
    QorChatServerAdapter.prototype.sendMessage = function (roomId, conversationId, otherUserId, messageText, clientGuid, done) {
        console.log(messageText);
        console.log("QorChatServerAdapter: sendMessage");
        var msg = new QorChatMessageOptions();
        msg.content = messageText;
        msg.fromUserId = this.currentUser.Id.toString();
        msg.fromUserAvatar = this.currentUser.ProfilePictureUrl;
        var jsonStr = "";
        if (conversationId) {
            msg.convId = conversationId;
            msg.receiverId = conversationId;
            var data = new QorChatMeetingDataPkg(msg);
            jsonStr = JSON.stringify(data);
        }
        else {
            var emails = this._getPrivateConvEmails(otherUserId.toString());
            msg.convId = this._getConvByEmails(emails, true);
            msg.receiverId = otherUserId.toString();
            var data = new QorChatPrivateDataPkg(msg);
            jsonStr = JSON.stringify(data);
        }
        this.conn.send(jsonStr);
        console.log(jsonStr);
    };
    QorChatServerAdapter.prototype.sendTypingSignal = function (roomId, conversationId, userToId, done) {
        return;
        console.log("QorChatServerAdapter: sendTypingSignal");
    };
    QorChatServerAdapter.prototype.getMessageHistory = function (roomId, conversationId, otherUserId, done) {
        console.log("QorChatServerAdapter: getMessageHistory");
        if (!conversationId) {
            var emails = this._getPrivateConvEmails(otherUserId.toString());
            conversationId = this._getConvByEmails(emails, true);
        }
        var msgs = this._getChatHistory(conversationId);
        done(msgs);
    };
    QorChatServerAdapter.prototype.getUserInfo = function (userId, done) {
        console.log("QorChatServerAdapter: getUserInfo");
        if (!this.accessable) {
            alert("maybe your email account was not ailable on demo.qortex.com @theplant org, contact yeer for solution:)");
            return;
        }
        console.log(userId);
        var user = null;
        for (var i = 0; i < this.users.length; i++) {
            if (this.users[i].Id == userId) {
                user = this.users[i];
                break;
            }
        }
        if (user == null)
            throw "User doesn't exit. User id: " + userId;
        done(user);
    };
    QorChatServerAdapter.prototype.getUserList = function (roomId, conversationId, done) {
        console.log("QorChatServerAdapter: getUserList");
        if (roomId == QorChatAdapterConstants.DEFAULT_ROOM_ID) {
            if (conversationId) {
                console.log(conversationId);
                var users = this._getConvParticipants(conversationId);
                done(users);
                return;
            }
            done(this.users);
            return;
        }
        throw "The given room or conversation is not supported by the demo adapter";
    };
    QorChatServerAdapter.prototype.getMeetingList = function (roomId, done) {
        console.log("QorChatServerAdapter: getMeetingList");
        if (roomId == QorChatAdapterConstants.DEFAULT_ROOM_ID) {
            done(this.meetings);
            return;
        }
        throw "The given room or conversation is not supported by the demo adapter";
    };
    QorChatServerAdapter.prototype.enterRoom = function (roomId, done) {
        console.log("QorChatServerAdapter: enterRoom");
        if (!this.accessable) {
            return;
        }
        if (roomId != QorChatAdapterConstants.DEFAULT_ROOM_ID)
            throw "Only the default room is supported in the demo adapter";
        var userListChangedInfo = new ChatUserListChangedInfo();
        userListChangedInfo.RoomId = QorChatAdapterConstants.DEFAULT_ROOM_ID;
        userListChangedInfo.UserList = this.users;
        this.clientAdapter.triggerUserListChanged(userListChangedInfo);
    };
    QorChatServerAdapter.prototype.leaveRoom = function (roomId, done) {
        console.log("QorChatServerAdapter: leaveRoom");
    };
    QorChatServerAdapter.prototype.addOneParticipant = function (convId, existUserIds, userId) {
        if (existUserIds.length > 2) {
            this._addParticipantToMeeting(convId, userId);
            return convId;
        }
        var emails = this._getMeetingConvEmails(existUserIds, userId);
        convId = this._getConvByEmails(emails, false);
        return convId;
    };
    QorChatServerAdapter.prototype._getMeetingConvEmails = function (withUserIds, userId) {
        var emails = new Array();
        for (var i = 0; i < withUserIds.length; i++) {
            var user = this._getUserById(withUserIds[i]);
            emails.push(user.Email);
        }
        var newUser = this._getUserById(userId);
        emails.push(newUser.Email);
        return emails;
    };
    QorChatServerAdapter.prototype._getPrivateConvEmails = function (toUserId) {
        var emails = new Array();
        var toUser = this._getUserById(toUserId);
        emails.push(this.currentUser.Email);
        emails.push(toUser.Email);
        return emails;
    };
    QorChatServerAdapter.prototype._setCurrentUserAndUserList = function (email) {
        var self = this;
        self.users = new Array();
        $.ajax(QorChatAdapterConstants.CHAT_SERVER_BASE_HTTP_URL + "/teams/theplant/users", {
            async: false,
            type: 'get',
            headers: { Authorization: 'Bearer ' + self.qorchatToken },
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
                    cui.Status = 0 /* Offline */;
                    self.users.push(cui);
                    if (cui.Email == email) {
                        self.currentUser = cui;
                    }
                    i++;
                }
            }
        });
        return self.currentUser != null;
    };
    QorChatServerAdapter.prototype._addParticipantToMeeting = function (convId, newUserId) {
        var self = this;
        var ids = new Array();
        ids.push(newUserId);
        var options = new AddParticipantOptions();
        options.convId = convId;
        options.participantIds = ids;
        $.ajax(QorChatAdapterConstants.CHAT_SERVER_BASE_HTTP_URL + "/teams/theplant/conversations/add_participants", {
            async: false,
            type: 'post',
            headers: { Authorization: 'Bearer ' + self.qorchatToken },
            contentType: 'application/json',
            data: JSON.stringify(options),
            dataType: 'json',
            success: function (data) {
                if (data.Success) {
                    var newUser = self._getUserById(newUserId);
                    self._notifyUserAdded(convId, newUser.Email);
                }
            }
        });
    };
    QorChatServerAdapter.prototype._notifyUserAdded = function (convId, newUserEmail) {
        var ntf = new QorChatNotificationOptions();
        ntf.convId = convId;
        ntf.inviter_email = this.currentUser.Email;
        var emails = new Array();
        emails.push(newUserEmail);
        ntf.new_added_user_emails = emails;
        var data = new QorChatNotifyDataPkg(ntf);
        var jsonStr = JSON.stringify(data);
        this.conn.send(jsonStr);
    };
    QorChatServerAdapter.prototype._getConvParticipants = function (convId) {
        var users = new Array();
        var self = this;
        $.ajax(QorChatAdapterConstants.CHAT_SERVER_BASE_HTTP_URL + "/teams/theplant/conversations/" + convId, {
            async: false,
            type: 'get',
            headers: { Authorization: 'Bearer ' + self.qorchatToken },
            contentType: 'application/json',
            dataType: 'json',
            success: function (data) {
                users = self._getUsersByIds(data.participantIds);
            }
        });
        return users;
    };
    QorChatServerAdapter.prototype._getConvByEmails = function (emails, useCache) {
        var self = this;
        var convId = "";
        var options = new QueryConvOptions();
        options.participantEmails = emails.sort();
        var emailsStr = options.participantEmails.join("-");
        var key = "qorchat-conv-key-" + emailsStr;
        var id = window.localStorage.getItem(key);
        if (useCache && id) {
            convId = id;
            return convId;
        }
        $.ajax(QorChatAdapterConstants.CHAT_SERVER_BASE_HTTP_URL + "/teams/theplant/conversations", {
            async: false,
            type: 'post',
            data: JSON.stringify(options),
            headers: {
                Authorization: 'Bearer ' + self.qorchatToken
            },
            contentType: 'application/json',
            dataType: 'json',
            success: function (data) {
                convId = data.id;
            }
        });
        if (useCache) {
            window.localStorage.setItem(key, convId);
        }
        return convId;
    };
    QorChatServerAdapter.prototype._getChatHistory = function (convId) {
        var self = this;
        var msgs = new Array();
        var url = QorChatAdapterConstants.CHAT_SERVER_BASE_HTTP_URL + "/teams/theplant/messages?convId=" + convId + "&before=&limit=5";
        $.ajax(url, {
            async: false,
            type: 'get',
            headers: {
                Authorization: 'Bearer ' + self.qorchatToken
            },
            contentType: 'application/json',
            dataType: 'json',
            success: function (data) {
                if (!data) {
                    return;
                }
                for (var i = 0; i < data.length; i++) {
                    var msg = new ChatMessageInfo();
                    msg.ConversationId = convId;
                    msg.RoomId = QorChatAdapterConstants.DEFAULT_ROOM_ID;
                    var generateGuidPart = function () { return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); };
                    var clientGuid = (generateGuidPart() + generateGuidPart() + '-' + generateGuidPart() + '-' + generateGuidPart() + '-' + generateGuidPart() + '-' + generateGuidPart() + generateGuidPart() + generateGuidPart());
                    msg.ClientGuid = clientGuid;
                    msg.UserFromId = data[i].fromUserId;
                    msg.UserToId = self.currentUser.Id;
                    msg.Message = data[i].content;
                    msgs.unshift(msg);
                }
            }
        });
        return msgs;
    };
    // gets the given user from the user list
    QorChatServerAdapter.prototype._getUserById = function (userId) {
        for (var i = 0; i < this.users.length; i++) {
            if (this.users[i].Id.toString() == userId)
                return this.users[i];
        }
        throw "Could not find the given user";
    };
    QorChatServerAdapter.prototype._getUsersByIds = function (userIds) {
        var users = new Array();
        ;
        for (var i = 0; i < this.users.length; i++) {
            if (userIds.indexOf(this.users[i].Id.toString()) != -1) {
                users.push(this.users[i]);
            }
        }
        return users;
    };
    QorChatServerAdapter.prototype._getUserByEmail = function (email) {
        for (var i = 0; i < this.users.length; i++) {
            if (this.users[i].Email == email)
                return this.users[i];
        }
        throw "Could not find the given user";
    };
    QorChatServerAdapter.prototype._getUserByEmails = function (emails) {
        var users = new Array();
        for (var i = 0; i < this.users.length; i++) {
            if (emails.indexOf(this.users[i].Email) != -1) {
                users.push(this.users[i]);
            }
        }
        return users;
    };
    return QorChatServerAdapter;
})();
var QorChatAdapter = (function () {
    function QorChatAdapter(email) {
        // TODO remove hardcode
        if (!email) {
            //Local debug
            email = "athom@126.com";
        }
        this.email = email;
        this.qorchatToken = this.currentUserAccessToken();
        this.loadCurrentUserId();
    }
    // called when the adapter is initialized
    QorChatAdapter.prototype.init = function (done) {
        if (!this.currentUser) {
            return;
        }
        this.client = new QorChatClientAdapter();
        this.server = new QorChatServerAdapter(this.client, this.email, this.qorchatToken);
        done(this.currentUser.Id);
    };
    QorChatAdapter.prototype.loadCurrentUserId = function () {
        var userId = 0;
        var self = this;
        $.ajax(QorChatAdapterConstants.CHAT_SERVER_BASE_HTTP_URL + "/users/my-account", {
            async: false,
            type: 'get',
            headers: { Authorization: 'Bearer ' + self.qorchatToken },
            contentType: 'application/json',
            dataType: 'json',
            success: function (u) {
                var user = new ChatUserInfo();
                user.Id = u.id;
                user.RoomId = QorChatAdapterConstants.DEFAULT_ROOM_ID;
                user.Name = u.name;
                user.Email = u.email;
                user.ProfilePictureUrl = u.avatar;
                user.Status = 0 /* Offline */;
                self.currentUser = user;
            }
        });
    };
    QorChatAdapter.prototype.currentUserAccessToken = function () {
        var token = "";
        var self = this;
        $.ajax(QorChatAdapterConstants.CHAT_SERVER_BASE_HTTP_URL + "/fetch_chat_token", {
            async: false,
            type: 'get',
            data: { email: this.email },
            contentType: 'application/json',
            dataType: 'json',
            success: function (data) {
                token = data;
            }
        });
        return token;
    };
    return QorChatAdapter;
})();
//# sourceMappingURL=jquery.chatjs.adapter.qorchat.js.map