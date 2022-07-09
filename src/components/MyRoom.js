import React, { useEffect, useState, useRef } from "react";
import {
  BsFillCameraVideoFill,
  BsCameraVideoOffFill,
  BsFillMicFill,
  BsFillMicMuteFill,
} from "react-icons/bs";
import { Room } from "./janus-lib";

var room;
var username = "BOB";
var roomId = 1234;
const MyRoom = (props) => {
  const [isAudioMute, setIsAudioMute] = useState(false);
  const [isVideoMute, setIsVideoMute] = useState(false);

  const [isRemoteAudioMute, setIsRemoteAudioMute] = useState(false);
  const [isRemoteVideoMute, setIsRemoteVideoMute] = useState(false);

  var onError = function (err) {
    if (err.indexOf("The room is unavailable") > -1) {
      alert("Room " + roomId + " is unavailable. Let's create one.");
      room
        .createRoom({
          room: roomId,
        })
        .then(() => {
          setTimeout(function () {
            room.register({
              username: username,
              room: roomId,
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

  var onWarning = function (msg) {
    alert(msg);
  };

  var localToggleMuteAudio = function () {
    room.toggleMuteAudio().then((muted) => {
      setIsAudioMute(muted);
      room.sendMessage({
        type: "request",
        sender: "BOB",
        action: "muteAudio",
        isMuted: muted,
      });
    });
  };

  var localToggleMuteVideo = function () {
    room.toggleMuteVideo().then((muted) => {
      setIsVideoMute(muted);
      room.sendMessage({
        type: "request",
        sender: "BOB",
        action: "muteVideo",
        isMuted: muted,
      });
    });
  };

  var onLocalJoin = function () {
    console.log("on local joi");
    var htmlStr = "<div>" + username + "</div>";
    htmlStr += '<video id="myvideo" width="100%"  autoplay muted="muted"/>';
    document.getElementById("videolocal").innerHTML = htmlStr;
    let target = document.getElementById("myvideo");
    console.log("room", room);
    room.attachStream(target, 0);
  };

  var onRemoteJoin = function (index, remoteUsername, feedId) {
    console.log("on remote join");
    document.getElementById("videoremote" + index).innerHTML =
      "<div>" +
      remoteUsername +
      '</div><video style="width:100%;" id="remotevideo' +
      index +
      '" autoplay/>';
    let target = document.getElementById("remotevideo" + index);
    room.attachStream(target, index);
  };

  var onRemoteUnjoin = function (index) {
    //document.getElementById('videoremote' + index).innerHTML = '<div>videoremote' + index + '</div>';
  };

  var onRecordedPlay = function () {
    // var htmlStr = '<div>playback</div>';
    // htmlStr += '<video id="playback" style="width:inherit;" autoplay muted="muted"/>';
    // document.getElementById('videoplayback').innerHTML = htmlStr;
    // let target = document.getElementById('playback');
    // room.attachRecordedPlayStream(target);
  };

  var onMessage = function (data) {
    if (!data) {
      return;
    }
    if (data.type && data.type === "chat") {
    } else if (data.type && data.type === "request") {
      if (data.action && data.action === "muteAudio") {
        setIsRemoteAudioMute(data.isMuted);
      } else if (data.action && data.action === "muteVideo") {
        setIsRemoteVideoMute(data.isMuted);
      }
    }
  };

  useEffect(() => {
    var options = {
      server: "http://192.168.1.42:8088/janus",
      room: 1234,
      token: "a1b2c3d4",
      extensionId: "bkkjmbohcfkfemepmepailpamnppmjkk",
      publishOwnFeed: true,
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      useRecordPlugin: true,
      volumeMeterSkip: 10,
      onLocalJoin: onLocalJoin,
      onRemoteJoin: onRemoteJoin,
      onRemoteUnjoin: onRemoteUnjoin,
      onRecordedPlay: onRecordedPlay,
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
            room: roomId,
          });
        }, 1000);
      })
      .catch((err) => {
        alert(err);
      });
  }, []);

  return (
    <div className="myroom-container">
      <div id="myvideoss" className="container shorter">
        <div className="videoscreen" id="videolocal"></div>
        <div className="icon-container">
          <div className="vidicon" onClick={localToggleMuteVideo}>
            {isVideoMute ? (
              <BsCameraVideoOffFill className="vidIcon" />
            ) : (
              <BsFillCameraVideoFill className="vidIcon" />
            )}
          </div>
          <div className="vidicon" onClick={localToggleMuteAudio}>
            {isAudioMute ? <BsFillMicMuteFill /> : <BsFillMicFill />}
          </div>
        </div>
      </div>
      <div className="container shorter">
        <div className="videoscreen" id="videoremote1">
          videoremote1
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

export default MyRoom;
