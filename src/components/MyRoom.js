import React, { useEffect, useState, useRef } from "react";
import {
  BsFillCameraVideoFill,
  BsCameraVideoOffFill,
  BsFillMicFill,
  BsFillMicMuteFill,
} from "react-icons/bs";

import { useInitJanus } from './init-janus'

const MyRoom = (props) => {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMute, setIsVideoMute] = useState(false);
  const myVideoRef = useRef()
  const remoteVideoRef = useRef()
  const { vroomHandle, isRemoteVideoMute } = useInitJanus({remoteVideoRef, myVideoRef })

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
      media: {
        audioSend: !isMute,
      },
      success: (jsep: JanusJS.JSEP) => {
        var publish = {
          "request": "configure",
           "audio": !isMute,
          // "video": true,
          // "data": true
        };
        vroomHandle.send({ message: publish, jsep: jsep });
      },
      error: (error: any) => {},
    });
    setIsAudioMuted(!isMute);
  };
  const muteVideo = () => {
    const handleId = vroomHandle.getId();
    const isMuteVideo = vroomHandle.isVideoMuted(handleId);
   
    if (isMuteVideo) {
      vroomHandle.unmuteVideo(handleId);
    } else {
      vroomHandle.muteVideo(handleId);
    }
    //publishLocalFeed(isAudioMuted , !isMuteVideo)
    vroomHandle.createOffer({
      media: { removeVideo: !isMuteVideo },
      success: (jsep: JanusJS.JSEP) => {
        vroomHandle.send({ message: { request: "configure" }, jsep: jsep });
      },
      error: (error: any) => {},
    });
    setIsVideoMute(!isMuteVideo);
  };
  useEffect(() => {
    console.log("isRemoteVideoMute::", isRemoteVideoMute)
  }, [isRemoteVideoMute])
  

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
            {isAudioMuted ? <BsFillMicMuteFill /> : <BsFillMicFill />}
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
            {isAudioMuted ? <BsFillMicMuteFill /> : <BsFillMicFill />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyRoom;
