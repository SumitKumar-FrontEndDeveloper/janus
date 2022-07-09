import React, { useState, useEffect } from "react";
import Janus from "../janus-lib/Janus";
import { newRemoteFeed } from './remote-feed'

const server = "http://192.168.1.42:8088/janus";
let janusRoom = null;
let vroomHandle = null;
let myroom = 1234;
let opaqueId = "videoroom-" + Janus.randomString(12);
let mypvtid = null;
let myusername = null;
let myid = null;
let mystream = null;
export const useInitJanus = ({ myVideoRef, remoteVideoRef}) => {

    const [vHandle, setVroomHandle] = useState(null);
    const [isRemoteVideoMute, setIsRemoteVideoMute] = useState(false);
    const [localStream, setlocalStream] = useState(null);
  
    const publishingMyLocalVideo = (useAudio) => {
        console.log("vroomHandle", vroomHandle)
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
                publishingMyLocalVideo(false);
            }
          },
        });
      }; 
    const handleRemoteStream = (stream) => {
        setIsRemoteVideoMute(stream.getVideoTracks().length == 0)
    }
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
                  setVroomHandle(pluginHandle)
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
                webrtcState: function (on) {
                  Janus.log(
                    "Janus says our WebRTC PeerConnection is " +
                      (on ? "up" : "down") +
                      " now"
                  );
                },
                onmessage: function (msg, jsep) {
                  console.log("init:::", msg, jsep)
                  let event = msg["videoroom"];
                  console.log("event:::::", event)
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
                      publishingMyLocalVideo(true);
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
                        let list = msg["publishers"][0];
                        let id = list["id"];
                        let display = list["display"];
                        let audio = list["audio_codec"];
                        let video = list["video_codec"];  
                        
                        console.log("jsep:::",jsep)
                        newRemoteFeed(id, display, audio, video,janusRoom,opaqueId,myroom,mypvtid,remoteVideoRef, handleRemoteStream,vroomHandle);
                       
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
                    console.log("jsep", jsep)
                    vroomHandle.handleRemoteJsep({ jsep: jsep });
                    //let audio = msg["audio_codec"];
                    // if (
                    //   mystream &&
                    //   mystream.getAudioTracks() &&
                    //   mystream.getAudioTracks().length > 0 &&
                    //   !audio
                    // ) {
                    //   alert(
                    //     "Our audio stream has been rejected, viewers won't hear us"
                    //   );
                    // }
                    // let video = msg["video_codec"];
                    // if (
                    //   mystream &&
                    //   mystream.getVideoTracks() &&
                    //   mystream.getVideoTracks().length > 0 &&
                    //   !video
                    // ) {
                    //   alert(
                    //     "Our video stream has been rejected, viewers won't see us"
                    //   );
                    // }
                  }
                },
                onlocalstream: function (stream) {
                    console.log("stream", stream)
                    setlocalStream(stream)
                   myVideoRef.current.srcObject = stream
                },
                onremotestream: function (stream) {
                  console.log("init stream", stream)
                },
                onremotetrack: function (track, mid, added) {
                },
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
  }, [])
  
  useEffect(() => {
    setVroomHandle(vroomHandle)
  },[vroomHandle])

  useEffect(() => {
    setIsRemoteVideoMute(isRemoteVideoMute)
  },[isRemoteVideoMute])


  return { vroomHandle:vHandle, isRemoteVideoMute, localStream }
};
