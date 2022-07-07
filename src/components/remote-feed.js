export const newRemoteFeed = (
  id,
  display,
  audio,
  video,
  janusRoom,
  opaqueId,
  myroom,
  mypvtid,
  feeds,
  remoteVideoRef,
  handleRemoteStream
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
        console.log("video track", stream.getVideoTracks().length)
        remoteVideoRef.current.srcObject = stream;
        handleRemoteStream(stream)
    },
    oncleanup: function () {
      remoteVideoRef.current.srcObject = "";
    },
  });
};
