// Change JITSI_DOMAIN if you use your own Jitsi server (see README).
const JITSI_DOMAIN = 'meet.jit.si';
const u = Auth.require();
const room = new URLSearchParams(location.search).get('room');
 
if (!room) {
  document.getElementById('jitsi').innerHTML = '<p style="color:#fff;padding:20px">No session selected. Go back and click Join/Start Session.</p>';
} else {
  const inviteUrl = location.href;
  const direct = `https://${JITSI_DOMAIN}/${room}`;
  document.getElementById('openTab').href = direct;
  document.getElementById('copyLink').onclick = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => toast('Invite link copied. Send it to the other person.'));
  };
  if (typeof JitsiMeetExternalAPI === 'undefined') {
    document.getElementById('jitsi').innerHTML = '<p style="color:#fff;padding:20px">Could not load Jitsi. Check your internet connection or use "Open in new tab".</p>';
  } else {
    new JitsiMeetExternalAPI(JITSI_DOMAIN, {
      roomName: room,
      parentNode: document.getElementById('jitsi'),
      width: '100%', height: '100%',
      userInfo: { displayName: u.name },
      configOverwrite: { prejoinPageEnabled: false, startWithAudioMuted: true }
    });
  }
}
 