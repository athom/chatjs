/// <reference path="jquery.d.ts"/>
/// <reference path="jquery.chatjs.interfaces.ts"/>
/// <reference path="jquery.chatjs.utils.ts"/>
/// <reference path="jquery.chatjs.adapter.ts"/>
/// <reference path="jquery.chatjs.window.ts"/>
/// <reference path="jquery.chatjs.messageboard.ts"/>
var MeetingListOptions = (function () {
    function MeetingListOptions() {
    }
    return MeetingListOptions;
})();
var MeetingList = (function () {
    function MeetingList(jQuery, options) {
        var _this = this;
        this.$el = jQuery;
        var defaultOptions = new MeetingListOptions();
        defaultOptions.emptyMeetingText = "No users available for chatting.";
        defaultOptions.height = 100;
        defaultOptions.meetingClicked = function () {
        };
        this.options = $.extend({}, defaultOptions, options);
        this.$el.addClass("user-list");
        ChatJsUtils.setOuterHeight(this.$el, this.options.height);
        // loads the list now
        this.options.adapter.server.getMeetingList(this.options.roomId, function (meetingList) {
            _this.populateList(meetingList);
        });
    }
    MeetingList.prototype.populateList = function (rawUserList) {
        // this will copy the list to a new array
        var userList = rawUserList.slice(0);
        this.$el.html('');
        if (userList.length == 0) {
            $("<div/>").addClass("user-list-empty").text(this.options.emptyMeetingText).appendTo(this.$el);
        }
        else {
            for (var i = 0; i < userList.length; i++) {
                var $userListItem = $("<div/>").addClass("user-list-item").attr("data-val-id", userList[i].Id).appendTo(this.$el);
                $("<div/>").addClass("content").text(userList[i].Name).appendTo($userListItem);
            }
        }
    };
    return MeetingList;
})();
$.fn.meetingList = function (options) {
    if (this.length) {
        this.each(function () {
            var data = new MeetingList($(this), options);
            $(this).data('meetingList', data);
        });
    }
    return this;
};
//# sourceMappingURL=jquery.chatjs.meetinglist.js.map