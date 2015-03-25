/// <reference path="jquery.d.ts"/>
/// <reference path="jquery.chatjs.interfaces.ts"/>
/// <reference path="jquery.chatjs.utils.ts"/>
/// <reference path="jquery.chatjs.adapter.ts"/>
/// <reference path="jquery.chatjs.window.ts"/>
/// <reference path="jquery.chatjs.friendswindow.ts"/>
/// <reference path="jquery.chatjs.messageboard.ts"/>
var PmWindowInfo = (function () {
    function PmWindowInfo() {
    }
    return PmWindowInfo;
})();
var PmWindowState = (function () {
    function PmWindowState() {
    }
    return PmWindowState;
})();
var ChatPmWindowOptions = (function () {
    function ChatPmWindowOptions() {
    }
    return ChatPmWindowOptions;
})();
// window that contains a conversation between users
var ChatPmWindow = (function () {
    function ChatPmWindow(options) {
        var _this = this;
        var defaultOptions = new ChatPmWindowOptions();
        defaultOptions.typingText = " is typing...";
        defaultOptions.isMaximized = true;
        defaultOptions.onCreated = function () {
        };
        defaultOptions.onClose = function () {
        };
        defaultOptions.chatJsContentPath = "/chatjs/";
        this.options = $.extend({}, defaultOptions, options);
        if (this.options.otherUserId) {
            this.options.adapter.server.getUserInfo(this.options.otherUserId, function (userInfo) {
                _this.options.chattingUserIds = new Array();
                _this.options.chattingUserIds.push(_this.options.userId.toString());
                _this.options.chattingUserIds.push(_this.options.otherUserId.toString());
                var chatWindowOptions = _this._setupChatWindowOptions(userInfo.Name, null, _this.options.otherUserId);
                _this.chatWindow = $.chatWindow(chatWindowOptions);
                _this._setupInviteButton();
                _this.options.onCreated(_this);
            });
        }
        else if (this.options.conversationId) {
            var convId = this.options.conversationId;
            this.options.adapter.server.getUserList(1, convId, function (users) {
                var existingUserIds = new Array();
                for (var i = 0; i < users.length; i++) {
                    existingUserIds.push(users[i].Id.toString());
                }
                _this.options.chattingUserIds = existingUserIds;
                var windowTitle = _this._genWindowTitle();
                var chatWindowOptions = _this._setupChatWindowOptions(windowTitle, convId, null);
                _this.chatWindow = $.chatWindow(chatWindowOptions);
                _this._setupInviteButton();
                _this.options.onCreated(_this);
            });
        }
    }
    ChatPmWindow.prototype._setupChatWindowOptions = function (title, convId, otherUserId) {
        var _this = this;
        var chatWindowOptions = new ChatWindowOptions();
        chatWindowOptions.title = title;
        chatWindowOptions.canClose = true;
        chatWindowOptions.isMaximized = this.options.isMaximized;
        chatWindowOptions.onCreated = function (window) {
            var messageBoardOptions = new MessageBoardOptions();
            messageBoardOptions.adapter = _this.options.adapter;
            messageBoardOptions.userId = _this.options.userId;
            messageBoardOptions.height = 235;
            messageBoardOptions.otherUserId = otherUserId;
            messageBoardOptions.conversationId = convId;
            messageBoardOptions.chatJsContentPath = _this.options.chatJsContentPath;
            messageBoardOptions.newMessage = function (message) {
                if (message.ConversationId == _this.options.conversationId && message.IsSystemMessage) {
                    var ids = message.NewAddedUserIds;
                    for (var i = 0; i < ids.length; i++) {
                        _this.options.chattingUserIds.push(ids[i].toString());
                    }
                    _this._refreshWindowTitle();
                }
            };
            window.$windowInnerContent.messageBoard(messageBoardOptions);
            window.$windowInnerContent.addClass("pm-window");
        };
        chatWindowOptions.onClose = function () {
            _this.options.onClose(_this);
        };
        chatWindowOptions.onMaximizedStateChanged = function (chatPmWindow, isMaximized) {
            _this.options.onMaximizedStateChanged(_this, isMaximized);
        };
        return chatWindowOptions;
    };
    ChatPmWindow.prototype._setupInviteButton = function () {
        var _this = this;
        var $addUserButton = $("<div/>").addClass("invite-user").prependTo(this.chatWindow.$windowTitle);
        $addUserButton.click(function (e) {
            e.stopPropagation();
            var popupWindowOptions = new ChatFriendsWindowOptions();
            popupWindowOptions.roomId = 1;
            popupWindowOptions.adapter = _this.options.adapter;
            popupWindowOptions.userId = _this.options.userId;
            popupWindowOptions.offsetRight = _this.getRightOffset();
            popupWindowOptions.titleText = "Add user to meeting";
            popupWindowOptions.isMaximized = true;
            popupWindowOptions.isPopUp = true;
            popupWindowOptions.contentHeight = 400;
            popupWindowOptions.filterUserIds = new Array();
            popupWindowOptions.filterUserIds = _this.options.chattingUserIds;
            // when the friends window changes state, we must save the state of the controller
            popupWindowOptions.onStateChanged = function () {
                //this.saveState();
            };
            // when the user clicks another user, we must create a pm window
            popupWindowOptions.userClicked = function (userId) {
                var ids = _this.options.chattingUserIds;
                if (ids.indexOf(userId.toString()) != -1) {
                    return;
                }
                var convId = _this.options.conversationId;
                if (convId) {
                    _this.options.adapter.server.addOneParticipant(convId, _this.options.chattingUserIds, userId.toString());
                    _this.options.chattingUserIds.push(userId.toString());
                    _this._refreshWindowTitle();
                }
                else {
                    convId = _this.options.adapter.server.addOneParticipant(null, _this.options.chattingUserIds, userId.toString());
                    _this.options.onParticipantInvited(_this, convId);
                }
                _this.options.conversationId = convId;
                _this.inviteUserWindow.chatWindow.$window.remove();
            };
            _this.inviteUserWindow = new ChatFriendsWindow(popupWindowOptions);
        });
    };
    ChatPmWindow.prototype._refreshWindowTitle = function () {
        this.chatWindow.$windowTitle.find(".text").text(this._genWindowTitle());
    };
    ChatPmWindow.prototype._genWindowTitle = function () {
        return "Meeting (" + this.options.chattingUserIds.length.toString() + " people)";
    };
    ChatPmWindow.prototype.focus = function () {
    };
    ChatPmWindow.prototype.setRightOffset = function (offset) {
        this.chatWindow.setRightOffset(offset);
    };
    ChatPmWindow.prototype.getRightOffset = function () {
        return this.chatWindow.getRightOffset();
    };
    ChatPmWindow.prototype.getWidth = function () {
        return this.chatWindow.getWidth();
    };
    ChatPmWindow.prototype.getState = function () {
        var state = new PmWindowState();
        state.isMaximized = this.chatWindow.getState();
        state.otherUserId = this.options.otherUserId;
        return state;
    };
    ChatPmWindow.prototype.setState = function (state) {
        // PmWindow ignores the otherUserId option while setting state
        this.chatWindow.setState(state.isMaximized);
    };
    return ChatPmWindow;
})();
$.chatPmWindow = function (options) {
    var pmWindow = new ChatPmWindow(options);
    return pmWindow;
};
//# sourceMappingURL=jquery.chatjs.pmwindow.js.map