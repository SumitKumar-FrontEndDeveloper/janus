import React, { useEffect, useState } from "react";
import offline from "../images/offline.jpg";
import {
  BsFillCameraVideoFill,
  BsCameraVideoOffFill,
  BsFillMicFill,
  BsFillMicMuteFill,
} from "react-icons/bs";

import Janus from "../janus-lib/Janus";
import $ from "jquery";

const server = "http://192.168.1.42:8088/janus";
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

  const publishOwnFeed = (useAudio) => {
    vroomHandle.createOffer({
      media: {
        audioRecv: true,
        videoRecv: true,
        audioSend: useAudio,
        videoSend: true,
      },
      success: function (jsep) {
        Janus.debug("Got publisher SDP!");
        Janus.debug(jsep);
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
        console.log('pluginHandle', pluginHandle)
        console.log('pluginHandle::', pluginHandle.webrtcStuff)
        console.log("audio::", audio)
      
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
        console.log("onmassage", jsep)
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
            $("#remote1").removeClass("hide").html(remoteFeed.rfdisplay).show();
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
      iceState: function (state) {
        console.log("state", state)
      },
      webrtcState: function (on) {
    
      },
      onlocalstream: function (stream) {
          console.log("onlocal streammmm")
      },
      muteAudio: function(handleId) {
        console.log("mote audio", handleId)
      },
      onremotetrack: function(track, mid, added) {
        console.log("onremotetrack", track)
      },
      onlocaltrack: function(track, added) {
        console.log("onlocaltrack", track)
      },
      mediaState: function (medium, on) {
        console.log("media state")
      },
      onremotestream: function (stream) {
        console.log("Remote Stream:::", janusRoom)
        if ($("#remotevideo" + remoteFeed.rfindex).length === 0) {
          $("#videoremote" + remoteFeed.rfindex)
            .children("img")
            .remove();
          $("#videoremote" + remoteFeed.rfindex).append(
            '<video class="rounded centered" id="waitingvideo' +
              remoteFeed.rfindex +
              '" width="100%" height="100%" />'
          );
          $("#videoremote" + remoteFeed.rfindex).append(
            '<video class="rounded centered relative hide" hello="new" id="remotevideo' +
              remoteFeed.rfindex +
              '" width="100%" height="100%" autoplay playsinline/>'
          );
           $("#remotevideo" + remoteFeed.rfindex).bind("playing", function () {
            $("#waitingvideo" + remoteFeed.rfindex).remove();
          });
        }
        Janus.attachMediaStream(
          $("#remotevideo" + remoteFeed.rfindex).get(0),
          stream
        );
        let videoTracks = stream.getVideoTracks();

        if (!videoTracks || videoTracks.length === 0) {
          $("#remotevideo" + remoteFeed.rfindex).hide();
          if (
            $("#videoremote" + remoteFeed.rfindex + " .no-video-container")
              .length === 0
          ) {
            $("#videoremote" + remoteFeed.rfindex).html(
              '<img src="' +
                offline +
                '" id="img1" class="card-media-image"></img>'
            );
          }
        } else {
          $(
            "#videoremote" + remoteFeed.rfindex + " .no-video-container"
          ).remove();
          $("#remotevideo" + remoteFeed.rfindex)
            .removeClass("hide")
            .show();
        }
      },
      oncleanup: function () {
        if (remoteFeed.spinner) remoteFeed.spinner.stop();
        $("#remotevideo" + remoteFeed.rfindex).remove();
        $("#videoremote" + remoteFeed.rfindex).html(
          '<img src="' +
            offline +
            '" id="img1" class="card-media-image" ></img>'
        );
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
              consentDialog: function (on) {
                Janus.debug(
                  "Consent dialog should be " + (on ? "on" : "off") + " now"
                );
              },
              mediaState: function (medium, on) {
                console.log("media state::")
                Janus.log(
                  "Janus " +
                    (on ? "started" : "stopped") +
                    " receiving our " +
                    medium
                );
              },
              onMute: function(ev) {
                console.log("getting on mute")
              },
              webrtcState: function (on) {
                Janus.log(
                  "Janus says our WebRTC PeerConnection is " +
                    (on ? "up" : "down") +
                    " now"
                );
              },
              onmessage: function (msg, jsep) {
                Janus.debug(" ::: Got a message (publisher) :::");
                Janus.debug(msg);
                let event = msg["videoroom"];
                Janus.debug("Event: " + event);
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
                    console.log("msg::",msg)
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
                  Janus.debug("Got room event. Handling SDP as well...");
                  Janus.debug(jsep);
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
                    $("#myvideo").hide();
                    $("#videolocal").append(
                      '<div class="no-video-container">' +
                        '<i class="fa fa-video-camera fa-5 no-video-icon" style="height: 100%;"></i>' +
                        '<span class="no-video-text" style="font-size: 16px;">Video rejected, no webcam</span>' +
                        "</div>"
                    );
                  }
                }
              },
              onlocalstream: function (stream) {
                console.log("onlocal stream:",stream.getAudioTracks()[0])
                mystream = stream;
                const video = document.querySelector("video#localvideo");
                const videoTracks = stream.getVideoTracks();
                video.srcObject = stream;
              },
              onremotetrack: function(track, mid, added) {
                console.log("onremotetrack:", track)
              },
              onlocaltrack: function(track, added) {
                console.log("onlocaltrack:", track)
              },
              oncleanup: function () {
                Janus.log(
                  " ::: Got a cleanup notification: we are unpublished now :::"
                );
                mystream = null;
              },
            });
          },
          ondataopen: function(res) {
            console.log("ondataopen")
          },
          ondata: function(res) {
            console.log("ondata")
          },
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
    console.log("isMute", isMute, mystream)
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
      <div id="myvideo" className="container shorter">
        <video
          id="localvideo"
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
        <div id="videoremote1" className="container">
          <img src={offline} id="img1" className="card-media-image"></img>
        </div>
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
