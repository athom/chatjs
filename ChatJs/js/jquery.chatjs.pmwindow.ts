/// <reference path="jquery.d.ts"/>
/// <reference path="jquery.chatjs.interfaces.ts"/>
/// <reference path="jquery.chatjs.utils.ts"/>
/// <reference path="jquery.chatjs.adapter.ts"/>
/// <reference path="jquery.chatjs.window.ts"/>
/// <reference path="jquery.chatjs.friendswindow.ts"/>
/// <reference path="jquery.chatjs.messageboard.ts"/>

interface JQueryStatic {
    chatPmWindow: (options: ChatPmWindowOptions) => ChatPmWindow;
}

class PmWindowInfo {
    otherUserId: number;
    conversationId: string;
    pmWindow: ChatPmWindow;
}

class PmWindowState {
    otherUserId: number;
    conversationId: string;
    isMaximized: boolean;
}


class ChatPmWindowOptions {
    userId: number;
    otherUserId: number;
    chattingUserIds: Array<string>;
    conversationId: string;
    typingText: string;
    adapter: IAdapter;
    isMaximized: boolean;
    onCreated: (pmWindow: ChatPmWindow) => void;
    onClose: (pmWindow: ChatPmWindow) => void;
    onParticipantInvited: (pmWindow: ChatPmWindow, convId:string) => void;
    onMaximizedStateChanged: (pmWindow: ChatPmWindow, isMaximized: boolean) => void;
    chatJsContentPath: string;
}

// window that contains a conversation between users
class ChatPmWindow implements IWindow<PmWindowState> {
    constructor(options: ChatPmWindowOptions) {

        var defaultOptions = new ChatPmWindowOptions();
        defaultOptions.typingText = " is typing...";
        defaultOptions.isMaximized = true;
        defaultOptions.onCreated = () => {};
        defaultOptions.onClose = () => { };
        defaultOptions.chatJsContentPath = "/chatjs/";

        this.options = $.extend({}, defaultOptions, options);

        if(this.options.otherUserId) {
            this.options.adapter.server.getUserInfo(this.options.otherUserId, (userInfo:ChatUserInfo) => {
                this.options.chattingUserIds = new Array<string>();
                this.options.chattingUserIds.push(this.options.userId.toString());
                this.options.chattingUserIds.push(this.options.otherUserId.toString());

                var chatWindowOptions = this._setupChatWindowOptions(userInfo.Name, null, this.options.otherUserId);
                this.chatWindow = $.chatWindow(chatWindowOptions);
                this._setupInviteButton();
                this.options.onCreated(this);
            });
        } else if (this.options.conversationId){
            var convId = this.options.conversationId;
            this.options.adapter.server.getUserList(1, convId, (users:Array<ChatUserInfo>) => {
                var existingUserIds = new Array<string>();
                for(var i = 0; i < users.length; i++){
                    existingUserIds.push(users[i].Id.toString());
                }
                this.options.chattingUserIds = existingUserIds;
                var windowTitle = this._genWindowTitle();
                var chatWindowOptions = this._setupChatWindowOptions(windowTitle, convId, null);
                this.chatWindow = $.chatWindow(chatWindowOptions);
                this._setupInviteButton();
                this.options.onCreated(this);
            });
        }
    }

    _setupChatWindowOptions(title:string, convId:string, otherUserId:number):ChatWindowOptions{
        var chatWindowOptions = new ChatWindowOptions();
        chatWindowOptions.title = title;
        chatWindowOptions.canClose = true;
        chatWindowOptions.isMaximized = this.options.isMaximized;
        chatWindowOptions.onCreated = (window:ChatWindow) => {
            var messageBoardOptions = new MessageBoardOptions();
            messageBoardOptions.adapter = this.options.adapter;
            messageBoardOptions.userId = this.options.userId;
            messageBoardOptions.height = 235;
            messageBoardOptions.otherUserId = otherUserId;
            messageBoardOptions.conversationId = convId;

            messageBoardOptions.chatJsContentPath = this.options.chatJsContentPath;

            messageBoardOptions.newMessage = (message: ChatMessageInfo) => {
                if(message.ConversationId == this.options.conversationId && message.IsSystemMessage){
                    var ids = message.NewAddedUserIds;
                    for(var i = 0; i<ids.length; i++){
                        this.options.chattingUserIds.push(ids[i].toString());
                    }
                    this._refreshWindowTitle();
                }
            };

            window.$windowInnerContent.messageBoard(messageBoardOptions);
            window.$windowInnerContent.addClass("pm-window");
        };
        chatWindowOptions.onClose = () => {
            this.options.onClose(this);
        }
        chatWindowOptions.onMaximizedStateChanged = (chatPmWindow, isMaximized) => {
            this.options.onMaximizedStateChanged(this, isMaximized);
        }

        return chatWindowOptions;
    }

    _setupInviteButton(){
        var $addUserButton = $("<div/>").addClass("invite-user").prependTo(this.chatWindow.$windowTitle);
        $addUserButton.click(e => {
            e.stopPropagation();

            var popupWindowOptions = new ChatFriendsWindowOptions();
            popupWindowOptions.roomId = 1;
            popupWindowOptions.adapter = this.options.adapter;
            popupWindowOptions.userId = this.options.userId;
            popupWindowOptions.offsetRight = this.getRightOffset();
            popupWindowOptions.titleText = "Add user to meeting";
            popupWindowOptions.isMaximized = true;
            popupWindowOptions.isPopUp = true;
            popupWindowOptions.contentHeight = 400;

            popupWindowOptions.filterUserIds = new Array<string>();
            popupWindowOptions.filterUserIds = this.options.chattingUserIds;


            // when the friends window changes state, we must save the state of the controller
            popupWindowOptions.onStateChanged = () => {
                //this.saveState();
            };

            // when the user clicks another user, we must create a pm window
            popupWindowOptions.userClicked = (userId) => {
                var ids = this.options.chattingUserIds;
                if (ids.indexOf(userId.toString()) != -1) {
                    return;
                }

                var convId = this.options.conversationId;
                if(convId){ // already in meeting window
                    this.options.adapter.server.addOneParticipant(convId, this.options.chattingUserIds, userId.toString());
                    this.options.chattingUserIds.push(userId.toString());
                    this._refreshWindowTitle()
                } else {
                    convId = this.options.adapter.server.addOneParticipant(null, this.options.chattingUserIds, userId.toString());
                    this.options.onParticipantInvited(this, convId);
                }

                this.options.conversationId = convId;
                this.inviteUserWindow.chatWindow.$window.remove();
            };

            this.inviteUserWindow = new ChatFriendsWindow(popupWindowOptions);
        });
    }

    _refreshWindowTitle(){
        this.chatWindow.$windowTitle.find(".text").text(this._genWindowTitle())
    }

    _genWindowTitle():string{
        return "Meeting(" + this.options.chattingUserIds.length.toString() +" people)";
    }

    focus() {
    }

    setRightOffset(offset: number): void {
        this.chatWindow.setRightOffset(offset);
    }

    getRightOffset() :number {
        return  this.chatWindow.getRightOffset();
    }

    getWidth(): number {
        return this.chatWindow.getWidth();
    }

    getState(): PmWindowState {
        var state = new PmWindowState();
        state.isMaximized = this.chatWindow.getState();
        state.otherUserId = this.options.otherUserId;
        return state;
    }

    setState(state: PmWindowState) {
        // PmWindow ignores the otherUserId option while setting state
        this.chatWindow.setState(state.isMaximized);
    }

    options: ChatPmWindowOptions;
    chatWindow: ChatWindow;
    inviteUserWindow: ChatFriendsWindow;
}

$.chatPmWindow = options => {
    var pmWindow = new ChatPmWindow(options);
    return pmWindow;
};