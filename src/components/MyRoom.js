import React, { useEffect, useState, useRef } from "react";
import offline from "../images/offline.jpg";
import {
  BsFillCameraVideoFill,
  BsCameraVideoOffFill,
  BsFillMicFill,
  BsFillMicMuteFill,
} from "react-icons/bs";

import Janus from "../janus-lib/Janus";

import { useInitJanus } from './init-janus'

const server = "http://192.168.1.42:8088/janus";
// server = process.env.REACT_APP_JANUS_URL;

const MyRoom = (props) => {
  const [isMuted, setIsMuted] = useState({ local: false, remote: false });
  const [isVideoMute, setIsVideoMute] = useState(false);
  const [isRemoteVideoMute, setisRemoteVideoMute] = useState(false);
  const myVideoRef = useRef()
  const remoteVideoRef = useRef()
  const { vroomHandle } = useInitJanus({remoteVideoRef, myVideoRef })

  const muteAudio = () => {
    console.log("vroomHandle", vroomHandle)
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
