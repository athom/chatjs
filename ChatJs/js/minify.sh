#!/bin/bash
/usr/local/bin/uglifyjs "jquery.autosize.js" "jquery.chatjs.utils.js" "jquery.chatjs.utils.js" "jquery.chatjs.adapter.servertypes.js"  "jquery.chatjs.adapter.js"  "jquery.chatjs.adapter.signalr.js" "jquery.chatjs.window.js" "jquery.chatjs.messageboard.js" "jquery.chatjs.userlist.js" "jquery.chatjs.meetinglist.js" "jquery.chatjs.pmwindow.js" "jquery.chatjs.friendswindow.js" "jquery.chatjs.controller.js" "jquery.chatjs.adapter.qorchat.js" "deepCopy.js" -o jquery.chatjs.min.js

cp jquery.chatjs.min.js $GOPATH/src/github.com/theplant/qortex/assets/javascripts/plugins/chatjs/
cp ../css/jquery.chatjs.css $GOPATH/src/github.com/theplant/qortex/assets/javascripts/plugins/chatjs/
