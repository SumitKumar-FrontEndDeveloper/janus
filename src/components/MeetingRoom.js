import React, { useEffect, useState } from "react";
import {
  BsFillCameraVideoFill,
  BsCameraVideoOffFill,
  BsFillMicFill,
  BsFillMicMuteFill,
} from "react-icons/bs";
import { Room } from "./util";
import { useParams } from 'react-router-dom'

var room
const MeetingRoom = (props) => {
  const { username, roomid } = useParams();
  const [isLocalAudioMute , setIsLocalAudioMute] = useState(false)
  const [isLocalVideoMute , setIsLocalVideoMute] = useState(false)
  const [isRemoteAudioMute , setIsRemoteAudioMute] = useState(false)
  const [isRemoteVideoMute , setIsRemoteVideoMute] = useState(false)
  
  
  useEffect(() => {
    var options = {
      server: "http://192.168.1.42:8088/janus", // process.ENV.server
      room: parseInt(roomid),
      token: "a1b2c3d4",
      extensionId: "bkkjmbohcfkfemepmepailpamnppmjkk",
      publishOwnFeed: true,
      onLocalJoin: onLocalJoin,
      onRemoteJoin: onRemoteJoin,
      onMessage: onMessage,
      onError: onError,
    };
    room = new Room(options);
    room
      .init()
      .then(function () {
        setTimeout(function () {
          room.register({
            username: username,
            room: parseInt(roomid),
          });
        }, 1000);
      })
      .catch((err) => {
        alert(err);
      });
  }, []);

  const onError = function (err) {
    if (err.indexOf("The room is unavailable") > -1) {
      alert("Room " + roomid + " is unavailable. Let's create one.");
      room.createRoom({
          room: parseInt(roomid),
        })
        .then(() => {
          setTimeout(function () {
            room.register({
              username: username,
              room: parseInt(roomid),
            });
          }, 1000);
        })
        .catch((err) => {
          alert(err);
        });
    } else {
      alert(err);
    }
  };

 

  const localToggleMuteAudio = function() {
    room.toggleMuteAudio()
      .then((muted) => {
        setIsLocalAudioMute(muted)
        room.sendMessage({
          type: 'request',
          sender: 'BOB',
          action: 'muteAudio',
          isMuted: muted
          
        })
      });
  }
  
  const localToggleMuteVideo = function() {
    room.toggleMuteVideo()
      .then((muted) => {
        setIsLocalVideoMute(muted)
        room.sendMessage({
          type: 'request',
          sender: 'BOB',
          action: 'muteVideo',
          isMuted: muted
          
        })
      });
    };
  

  const onLocalJoin = function () {
    console.log("on local joi");
    var htmlStr = "<div>" + username + "</div>";
    htmlStr += '<video id="myvideo" width="100%"  autoplay muted="muted"/>';
    document.getElementById("videolocal").innerHTML = htmlStr;
    let target = document.getElementById("myvideo");
    room.attachStream(target, 0);
  };

  const onRemoteJoin = function (index, remoteUsername, feedId) {
    console.log("on remote join")
    document.getElementById('videoremote' + index).innerHTML = '<div>' + remoteUsername +  '</div><video style="width:100%;" id="remotevideo' + index + '" autoplay/>';
    let target = document.getElementById('remotevideo' + index);
    room.attachStream(target, index);
  };

 

 

  const onMessage = function (data) {
    if (!data) {
      return;
    }
    if (data.type && data.type === "chat") {
    } else if (data.type && data.type === "request") {
      if (data.action && data.action === "muteAudio") {
        console.log("muteAudio", data.isMuted)
        setIsRemoteAudioMute(data.isMuted)
      } else if (data.action && data.action === "muteVideo") {
        setIsRemoteVideoMute(data.isMuted)
      }
    }
  };

  return (
    <div className="myroom-container">
      <div id="myvideoss" className="container shorter">
        <div className="videoscreen" id="videolocal"></div>
        <div className="icon-container">
          <div className="vidicon" onClick={localToggleMuteVideo}>
            {isLocalVideoMute ? (
              <BsCameraVideoOffFill className="vidIcon" />
            ) : (
              <BsFillCameraVideoFill className="vidIcon" />
            )}
          </div>
          <div className="vidicon" onClick={localToggleMuteAudio}>
            {isLocalAudioMute ? <BsFillMicMuteFill /> : <BsFillMicFill />}
          </div>
        </div>
      </div>
      <div className="container shorter">
        <div className="videoscreen" id="videoremote1">
          Waiting.....
        </div>
        <div className="icon-container">
          <div className="vidicon" onClick={() => {}}>
            {isRemoteVideoMute ? (
              <BsCameraVideoOffFill className="vidIcon" />
            ) : (
              <BsFillCameraVideoFill className="vidIcon" />
            )}
          </div>
          <div className="vidicon" onClick={() => {}}>
            {isRemoteAudioMute ? <BsFillMicMuteFill /> : <BsFillMicFill />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
