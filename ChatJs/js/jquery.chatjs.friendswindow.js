/// <reference path="jquery.d.ts"/>
/// <reference path="jquery.chatjs.interfaces.ts"/>
/// <reference path="jquery.chatjs.adapter.ts"/>
/// <reference path="jquery.chatjs.utils.ts"/>
/// <reference path="jquery.chatjs.window.ts"/>
/// <reference path="jquery.chatjs.userlist.ts"/>
/// <reference path="jquery.chatjs.meetinglist.ts"/>
var ChatFriendsWindowState = (function () {
    function ChatFriendsWindowState() {
    }
    return ChatFriendsWindowState;
})();
var ChatFriendsWindowOptions = (function () {
    function ChatFriendsWindowOptions() {
    }
    return ChatFriendsWindowOptions;
})();
// window that contains a list of friends. This component is used as opposed to "jquery.chatjs.rooms". The "rooms" component
// should be used when the user has the ability to select rooms and broadcast them. The "friends window" is used when you want a 
// Facebook style friends list.
var ChatFriendsWindow = (function () {
    function ChatFriendsWindow(options) {
        var _this = this;
        var defaultOptions = new ChatFriendsWindowOptions();
        defaultOptions.titleText = "Friends";
        defaultOptions.isMaximized = true;
        defaultOptions.offsetRight = 10;
        defaultOptions.contentHeight = 500;
        defaultOptions.emptyRoomText = "No users available for chatting.";
        this.options = $.extend({}, defaultOptions, options);
        this.options.adapter.server.enterRoom(this.options.roomId, function () {
            // loads the user list
        });
        var chatWindowOptions = new ChatWindowOptions();
        chatWindowOptions.title = this.options.titleText;
        chatWindowOptions.canClose = this.options.isPopUp;
        chatWindowOptions.height = 300;
        chatWindowOptions.isMaximized = this.options.isMaximized;
        chatWindowOptions.onMaximizedStateChanged = function (chatWindow, isMaximized) {
            _this.options.onStateChanged(isMaximized);
        };
        chatWindowOptions.onCreated = function (window) {
            // once the chat window is created, it's time to add content
            _this.showUserList(window);
        };
        this.chatWindow = $.chatWindow(chatWindowOptions);
        this.chatWindow.setRightOffset(this.options.offsetRight);
        if (this.options.isPopUp) {
            return;
        }
        return; // Disable tab for now
        // tab
        this.$windowInnerTabs = $("<ul/>").addClass("chat-window-inner-tabs").prependTo(this.chatWindow.$windowContent);
        this.$windowInnerTabFriends = $("<li><a herf='javascript:;'>private chat</a></li>").addClass("chat-window-inner-tab current").appendTo(this.$windowInnerTabs);
        this.$windowInnerTabGroups = $("<li><a herf='javascript:;'>group chat</a></li>").addClass("chat-window-inner-tab").appendTo(this.$windowInnerTabs);
        this.$windowInnerTabFriends.click(function () {
            _this.switchToPrivateChatTab();
        });
        this.$windowInnerTabGroups.click(function () {
            _this.switchToGroupChat();
        });
    }
    ChatFriendsWindow.prototype.switchToPrivateChatTab = function () {
        this.$windowInnerTabFriends.addClass("current");
        this.$windowInnerTabGroups.removeClass("current");
        this.showUserList(this.chatWindow);
    };
    ChatFriendsWindow.prototype.showUserList = function (window) {
        var userListOptions = new UserListOptions();
        userListOptions.adapter = this.options.adapter;
        userListOptions.roomId = this.options.roomId;
        userListOptions.userId = this.options.userId;
        userListOptions.height = this.options.contentHeight;
        userListOptions.excludeCurrentUser = true;
        userListOptions.emptyRoomText = this.options.emptyRoomText;
        userListOptions.userClicked = this.options.userClicked;
        userListOptions.filterUserIds = this.options.filterUserIds;
        window.$windowInnerContent.userList(userListOptions);
    };
    ChatFriendsWindow.prototype.showMeetingList = function () {
        var meetingListOptions = new MeetingListOptions();
        meetingListOptions.adapter = this.options.adapter;
        meetingListOptions.roomId = this.options.roomId;
        meetingListOptions.meetingClicked = this.options.userClicked;
        this.chatWindow.$windowInnerContent.meetingList(meetingListOptions);
    };
    ChatFriendsWindow.prototype.switchToGroupChat = function () {
        this.$windowInnerTabFriends.removeClass("current");
        this.$windowInnerTabGroups.addClass("current");
        this.showMeetingList();
        //            this.chatWindow.$windowInnerContent.find(".user-list").hide();
        //        this.chatWindow.$windowInnerContent.remove();
    };
    ChatFriendsWindow.prototype.focus = function () {
    };
    ChatFriendsWindow.prototype.setRightOffset = function (offset) {
        this.chatWindow.setRightOffset(offset);
    };
    ChatFriendsWindow.prototype.getRightOffset = function () {
        return this.chatWindow.getRightOffset();
    };
    ChatFriendsWindow.prototype.getWidth = function () {
        return this.chatWindow.getWidth();
    };
    ChatFriendsWindow.prototype.getState = function () {
        var state = new ChatFriendsWindowState();
        state.isMaximized = this.chatWindow.getState();
        return state;
    };
    ChatFriendsWindow.prototype.setState = function (state) {
        this.chatWindow.setState(state.isMaximized);
    };
    return ChatFriendsWindow;
})();
$.chatFriendsWindow = function (options) {
    var friendsWindow = new ChatFriendsWindow(options);
    return friendsWindow;
};
//# sourceMappingURL=jquery.chatjs.friendswindow.js.map