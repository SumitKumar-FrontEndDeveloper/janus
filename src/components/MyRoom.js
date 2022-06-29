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
        audioRecv: false,
        videoRecv: false,
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
        Janus.debug(" ::: Got a message (subscriber) :::", msg);

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
          // Answer and attach
          remoteFeed.createAnswer({
            jsep: jsep,
            // Add data:true here if you want to subscribe to datachannels as well
            // (obviously only works if the publisher offered them in the first place)
            media: { audioSend: false, videoSend: false }, // We want recvonly audio/video
            success: function (jsep) {
              let body = { request: "start", room: myroom };
              remoteFeed.send({ message: body, jsep: jsep });
            },
            error: function (error) {},
          });
        }
      },
      iceState: function (state) {
        
      },
      webrtcState: function (on) {
    
      },
      onlocalstream: function (stream) {
      },
      onremotestream: function (stream) {
        //
        setisRemoteVideoMute(stream.getVideoTracks().length === 0);
        let addButtons = false;
        if ($("#remotevideo" + remoteFeed.rfindex).length === 0) {
          // No remote video yet
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
          $("#videoremote" + remoteFeed.rfindex).append(
            '<div className="icon-container"><div className="vidicon"><BsFillCameraVideoFill className="vidIcon" /></div><div className="vidicon"><BsFillMicFill /></div></div>'
          );
          // Show the video, hide the spinner and show the resolution when we get a playing event
          $("#remotevideo" + remoteFeed.rfindex).bind("playing", function () {
            if (remoteFeed.spinner) remoteFeed.spinner.stop();
            remoteFeed.spinner = null;
            $("#waitingvideo" + remoteFeed.rfindex).remove();
            if (this.videoWidth)
              $("#remotevideo" + remoteFeed.rfindex)
                .removeClass("hide")
                .show();
            // if (Janus.webRTCAdapter.browserDetails.browser === "firefox") {
            //   // Firefox Stable has a bug: width and height are not immediately available after a playing
            //   setTimeout(function () {
            //     let width = $("#remotevideo" + remoteFeed.rfindex).get(
            //       0
            //     ).videoWidth;
            //     let height = $("#remotevideo" + remoteFeed.rfindex).get(
            //       0
            //     ).videoHeight;
            //     $("#curres" + remoteFeed.rfindex)
            //       .removeClass("hide")
            //       .text(width + "x" + height)
            //       .show();
            //   }, 2000);
            // }
          });
        }
        Janus.attachMediaStream(
          $("#remotevideo" + remoteFeed.rfindex).get(0),
          stream
        );
        let videoTracks = stream.getVideoTracks();

        if (!videoTracks || videoTracks.length === 0) {
          // No remote video
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
        // Make sure the browser supports WebRTC
        janusRoom = new Janus({
          server: server,
          success: function () {
            // Attach to VideoRoom plugin
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
                Janus.log(
                  "Janus " +
                    (on ? "started" : "stopped") +
                    " receiving our " +
                    medium
                );
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
                    // Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
                    myid = msg["id"];
                    mypvtid = msg["private_id"];
                    console.log(
                      "Successfully joined room " +
                        msg["room"] +
                        " with ID " +
                        myid
                    );
                    publishOwnFeed(true);
                    // Any new feed to attach to?
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
                    // The room has been destroyed
                    Janus.warn("The room has been destroyed!");
                  } else if (event === "event") {
                    // Any new feed to attach to?
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
                        // This is a "no such room" error: give a more meaningful description
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
                    // Audio has been rejected
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
                    // Video has been rejected
                    alert(
                      "Our video stream has been rejected, viewers won't see us"
                    );
                    // Hide the webcam video
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
                mystream = stream;
                const video = document.querySelector("video#localvideo");
                const videoTracks = stream.getVideoTracks();
                video.srcObject = stream;
              },
              oncleanup: function () {
                Janus.log(
                  " ::: Got a cleanup notification: we are unpublished now :::"
                );
                mystream = null;
              },
            });
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
    if (isMute) {
      vroomHandle.unmuteAudio(handleId);
    } else {
      vroomHandle.muteAudio(handleId);
    }
    vroomHandle.createOffer({
      media: { removeAudio: !isMute },
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
