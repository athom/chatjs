/// <reference path="jquery.d.ts"/>
/// <reference path="jquery.chatjs.interfaces.ts"/>
/// <reference path="jquery.chatjs.utils.ts"/>
/// <reference path="jquery.chatjs.adapter.ts"/>
/// <reference path="jquery.chatjs.window.ts"/>
/// <reference path="jquery.chatjs.messageboard.ts"/>

interface JQuery {
    meetingList: (options: MeetingListOptions) => JQuery;
}


class MeetingListOptions {
    adapter: IAdapter;
    roomId: number;
    emptyMeetingText: string;
    height: number;
    meetingClicked: (userId: number) => void;
}

class MeetingList {
    constructor(jQuery: JQuery, options: MeetingListOptions) {
        this.$el = jQuery;

        var defaultOptions = new MeetingListOptions();
        defaultOptions.emptyMeetingText = "No users available for chatting.";
        defaultOptions.height = 100;
        defaultOptions.meetingClicked = () => {};

        this.options = $.extend({}, defaultOptions, options);

        this.$el.addClass("user-list");

        ChatJsUtils.setOuterHeight(this.$el, this.options.height);


        // loads the list now
        this.options.adapter.server.getMeetingList(this.options.roomId, meetingList => {
            this.populateList(meetingList);
        })
    }


    populateList(rawUserList) {

        // this will copy the list to a new array
        var userList = rawUserList.slice(0);


        this.$el.html('');
        if (userList.length == 0) {
            $("<div/>").addClass("user-list-empty").text(this.options.emptyMeetingText).appendTo(this.$el);
        } else {
            for (var i = 0; i < userList.length; i++) {

                var $userListItem = $("<div/>")
                    .addClass("user-list-item")
                    .attr("data-val-id", userList[i].Id)
                    .appendTo(this.$el);

                $("<div/>")
                    .addClass("content")
                    .text(userList[i].Name)
                    .appendTo($userListItem);

                // makes a click in the user to either create a new chat window or open an existing
                // I must clusure the 'i'
//                (userId => {
//                    // handles clicking in a user. Starts up a new chat session
//                    $userListItem.click(() => {
//                        this.options.meetingClicked(userId);
//                    });
//                })(userList[i].Id);
            }
        }
    }

    $el: JQuery;
    options: MeetingListOptions;
}

$.fn.meetingList = function(options: MeetingListOptions) {
    if (this.length) {
        this.each(function() {
            var data = new MeetingList($(this), options);
            $(this).data('meetingList', data);
        });
    }
    return this;
};