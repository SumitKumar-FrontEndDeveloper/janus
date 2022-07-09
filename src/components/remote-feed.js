export const newRemoteFeed = (
  id,
  display,
  audio,
  video,
  janusRoom,
  opaqueId,
  myroom,
  mypvtid,
  remoteVideoRef,
  handleRemoteStream,
  vroomHandle
) => {
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
      console.log("  -- Error attaching plugin...", error);
    },
    ondata: function(msg) {
      console.log("ondata", msg)
    },
    ondataopen: function(msg) {
      console.log("ondataopen", msg)
    },
    
    onmessage: function (msg, jsep) {
      console.log("msg::", vroomHandle.isAudioMuted(vroomHandle.getId(), false))
      console.log("msg::", msg)
      if (jsep) {
        remoteFeed.createAnswer({
          jsep: jsep,
          media: { audioSend: true, videoSend: true },
          success: function (jsep) {
            console.log("my audio status",)
            let body = { request: "start", room: myroom };
            remoteFeed.send({ message: body, jsep: jsep });
          },
          error: function (error) {},
        });
      }
    },
    iceState: function (state) {},
    webrtcState: function (on) {},
    onlocalstream: function (stream) {
      console.log("onlocalstream")
    },
    muteAudio: function (handleId) {
      console.log("mute audio")
    },
    onremotetrack: function (track, mid, added) {
      console.log("onremotetrack::",track , mid , added)
    },
    onlocaltrack: function (track, added) {
      console.log("onlocaltrack::")
    },
    mediaState: function (medium, on) {
      console.log("media state")
    },
    onremotestream: function (stream) {
      console.log("message:::", stream.getTracks())
      if (stream.getAudioTracks().length > 0) {
        stream.getAudioTracks()[0].onmute = function(ev){
            console.log("on mute")
        }
      }
      //console.log("message::", vroomHandle.isAudioMuted(vroomHandle.getId(), false))
      if (
        stream &&
        stream.getAudioTracks().length > 0 &&
        !audio
      ) {
          console.log("hello")
      }
        console.log("getUserMedia", stream)
        remoteVideoRef.current.srcObject = stream;
        handleRemoteStream(stream)
    },
    oncleanup: function () {
      remoteVideoRef.current.srcObject = "";
    },
  });
};
