import React, { useEffect, useState, useRef } from "react";
import offline from "../images/offline.jpg";
import {
  BsFillCameraVideoFill,
  BsCameraVideoOffFill,
  BsFillMicFill,
  BsFillMicMuteFill,
} from "react-icons/bs";

import Janus from "../janus-lib/Janus";

const server = "http://172.16.10.65:8088/janus";
// server = process.env.REACT_APP_JANUS_URL;
let janusRoom = null;
let vroomHandle = null;
let myroom = 1234;
let opaqueId = "videoroom-" + Janus.randomString(12);
let mypvtid = null;
let myusername = null;
let feeds = [];
let myid = null;
let mystream = null;

const MyRoom = (props) => {
  const [isMuted, setIsMuted] = useState({ local: false, remote: false });
  const [isVideoMute, setIsVideoMute] = useState(false);
  const [isRemoteVideoMute, setisRemoteVideoMute] = useState(false);
  const myVideoRef = useRef()
  const remoteVideoRef = useRef()

  useEffect(() => {
    console.log('myVideoRef')
    console.log(myVideoRef.current)
  },[myVideoRef])

  const publishOwnFeed = (useAudio) => {
    vroomHandle.createOffer({
      media: {
        audioRecv: true,
        videoRecv: true,
        audioSend: useAudio,
        videoSend: true,
      },
      success: function (jsep) {
        const publish = { request: "configure", audio: useAudio, video: true };
        vroomHandle.send({ message: publish, jsep: jsep });
      },
      error: function (error) {
        Janus.error("WebRTC error:", error);
        if (useAudio) {
          publishOwnFeed(false);
        }
      },
    });
  };
  const newRemoteFeed = (id, display, audio, video) => {
    let remoteFeed = null;
    janusRoom.attach({
      plugin: "janus.plugin.videoroom",
      opaqueId: opaqueId,

      success: function (pluginHandle) {
        remoteFeed = pluginHandle;
        let subscribe = {
          request: "join",
          room: myroom,
          ptype: "subscriber",
          feed: id,
          private_id: mypvtid,
        };
        remoteFeed.videoCodec = video;
        remoteFeed.send({ message: subscribe });
      },
      error: function (error) {
        Janus.error("  -- Error attaching plugin...", error);
      },
      onmessage: function (msg, jsep) {
        let event = msg["videoroom"];
        if (event) {
          if (event === "attached") {
            for (let i = 1; i < 600; i++) {
              if (!feeds[i]) {
                feeds[i] = remoteFeed;
                remoteFeed.rfindex = i;
                break;
              }
            }
            remoteFeed.rfid = msg["id"];
            remoteFeed.rfdisplay = msg["display"];
          }
        }
        if (jsep) {
          remoteFeed.createAnswer({
            jsep: jsep,
            media: { audioSend: true, videoSend: true },
            success: function (jsep) {
              let body = { request: "start", room: myroom };
              remoteFeed.send({ message: body, jsep: jsep });
            },
            error: function (error) {},
          });
        }
      },
      iceState: function (state) {},
      webrtcState: function (on) {},
      onlocalstream: function (stream) {},
      muteAudio: function (handleId) {},
      onremotetrack: function (track, mid, added) {},
      onlocaltrack: function (track, added) {},
      mediaState: function (medium, on) {},
      onremotestream: function (stream) {
        remoteVideoRef.current.srcObject = stream
      },
      oncleanup: function () {
        remoteVideoRef.current.srcObject = ''
      },
    });
  };

  useEffect(() => {
    Janus.init({
      debug: "all",
      callback: function () {
        janusRoom = new Janus({
          server: server,
          success: function () {
            janusRoom.attach({
              plugin: "janus.plugin.videoroom",
              opaqueId: opaqueId,
              success: function (pluginHandle) {
                vroomHandle = pluginHandle;
                let reg = Janus.randomString(12);
                const register = {
                  request: "join",
                  room: myroom,
                  ptype: "publisher",
                  display: reg,
                };
                myusername = reg;
                vroomHandle.send({ message: register });
              },
              error: function (error) {
                Janus.error("  -- Error attaching plugin...", error);
              },
              consentDialog: function (on) {},
              mediaState: function (medium, on) {
                Janus.log(
                  "Janus " +
                    (on ? "started" : "stopped") +
                    " receiving our " +
                    medium
                );
              },
              onMute: function (ev) {},
              webrtcState: function (on) {
                Janus.log(
                  "Janus says our WebRTC PeerConnection is " +
                    (on ? "up" : "down") +
                    " now"
                );
              },
              onmessage: function (msg, jsep) {
                let event = msg["videoroom"];
                if (event != undefined && event != null) {
                  if (event === "joined") {
                    myid = msg["id"];
                    mypvtid = msg["private_id"];
                    console.log(
                      "Successfully joined room " +
                        msg["room"] +
                        " with ID " +
                        myid
                    );
                    publishOwnFeed(true);
                    if (
                      msg["publishers"] !== undefined &&
                      msg["publishers"] !== null
                    ) {
                      let list = msg["publishers"];

                      for (let f in list) {
                        let id = list[f]["id"];
                        let display = list[f]["display"];
                        let audio = list[f]["audio_codec"];
                        let video = list[f]["video_codec"];
                        console.log(
                          "  >> [" +
                            id +
                            "] " +
                            display +
                            " (audio: " +
                            audio +
                            ", video: " +
                            video +
                            ")"
                        );
                      }
                    }
                  } else if (event === "destroyed") {
                    Janus.warn("The room has been destroyed!");
                  } else if (event === "event") {
                    if (
                      msg["publishers"] !== undefined &&
                      msg["publishers"] !== null
                    ) {
                      let list = msg["publishers"];
                      for (let f in list) {
                        let id = list[f]["id"];
                        let display = list[f]["display"];
                        let audio = list[f]["audio_codec"];
                        let video = list[f]["video_codec"];
                        console.log(
                          "  >> [" +
                            id +
                            "] " +
                            display +
                            " (audio: " +
                            audio +
                            ", video: " +
                            video +
                            ")"
                        );
                        newRemoteFeed(id, display, audio, video);
                      }
                    } else if (
                      msg["leaving"] !== undefined &&
                      msg["leaving"] !== null
                    ) {
                      // One of the publishers has gone away?
                    } else if (
                      msg["unpublished"] !== undefined &&
                      msg["unpublished"] !== null
                    ) {
                      // One of the publishers has unpublished?
                      if (msg["unpublished"] === "ok") {
                        vroomHandle.hangup();
                        return;
                      }
                    } else if (
                      msg["error"] !== undefined &&
                      msg["error"] !== null
                    ) {
                      if (msg["error_code"] === 426) {
                      } else {
                        alert(msg["error"]);
                      }
                    }
                  }
                }
                if (jsep !== undefined && jsep !== null) {
                  vroomHandle.handleRemoteJsep({ jsep: jsep });
                  let audio = msg["audio_codec"];
                  if (
                    mystream &&
                    mystream.getAudioTracks() &&
                    mystream.getAudioTracks().length > 0 &&
                    !audio
                  ) {
                    alert(
                      "Our audio stream has been rejected, viewers won't hear us"
                    );
                  }
                  let video = msg["video_codec"];
                  if (
                    mystream &&
                    mystream.getVideoTracks() &&
                    mystream.getVideoTracks().length > 0 &&
                    !video
                  ) {
                    alert(
                      "Our video stream has been rejected, viewers won't see us"
                    );
                  }
                }
              },
              onlocalstream: function (stream) {
                 myVideoRef.current.srcObject = stream
              },
              onremotetrack: function (track, mid, added) {},
              onlocaltrack: function (track, added) {},
              oncleanup: function () {
                Janus.log(
                  " ::: Got a cleanup notification: we are unpublished now :::"
                );
                mystream = null;
              },
            });
          },
          ondataopen: function (res) {},
          ondata: function (res) {},
          error: function (error) {
            Janus.error(error);
          },
          destroyed: function () {},
        });
      },
    });
  }, []);

  const muteAudio = () => {
    const handleId = vroomHandle.getId();
    const isMute = vroomHandle.isAudioMuted(handleId);

    if (isMute) {
      vroomHandle.unmuteAudio(handleId);
    } else {
      vroomHandle.muteAudio(handleId);
    }
    vroomHandle.createOffer({
      success: (jsep: JanusJS.JSEP) => {
        vroomHandle.send({ message: { request: "configure" }, jsep: jsep });
      },
      error: (error: any) => {},
    });
    setIsMuted({ ...isMuted, local: !isMute });
  };
  const muteVideo = () => {
    const handleId = vroomHandle.getId();
    const isMuteVideo = vroomHandle.isVideoMuted(handleId);

    if (isMuteVideo) {
      vroomHandle.unmuteVideo(handleId);
    } else {
      vroomHandle.muteVideo(handleId);
    }
    vroomHandle.createOffer({
      media: { removeVideo: !isMuteVideo },
      success: (jsep: JanusJS.JSEP) => {
        vroomHandle.send({ message: { request: "configure" }, jsep: jsep });
      },
      error: (error: any) => {},
    });
    setIsVideoMute(!isMuteVideo);
  };

  return (
    <div className="myroom-container">
      <div id="myvideo" className="container shorter" >
        <video
          id="localvideo"
          ref={myVideoRef}
          className="rounded centered"
          width="100%"
          height="100%"
          autoPlay
          playsInline
          muted="muted"
        ></video>
        
        <div className="icon-container">
          <div className="vidicon" onClick={muteVideo}>
            {isVideoMute ? (
              <BsCameraVideoOffFill className="vidIcon" />
            ) : (
              <BsFillCameraVideoFill className="vidIcon" />
            )}
          </div>
          <div className="vidicon" onClick={muteAudio}>
            {isMuted?.local ? <BsFillMicMuteFill /> : <BsFillMicFill />}
          </div>
        </div>
      </div>
      <div className="container shorter">
        <video
          id="localvideo"
          ref={remoteVideoRef}
          className="rounded centered"
          width="100%"
          height="100%"
          autoPlay
          playsInline
          muted="muted"
        ></video>
        <div className="icon-container">
          <div className="vidicon" onClick={muteVideo}>
            {isRemoteVideoMute ? (
              <BsCameraVideoOffFill className="vidIcon" />
            ) : (
              <BsFillCameraVideoFill className="vidIcon" />
            )}
          </div>
          <div className="vidicon">
            {isMuted?.remote ? <BsFillMicMuteFill /> : <BsFillMicFill />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyRoom;
