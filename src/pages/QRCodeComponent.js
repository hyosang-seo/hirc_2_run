import React from 'react';
import QRCode from 'qrcode.react';

const QRCodeComponent = ({uuid, sessionId}) => {


  const currentDomain = window.location.origin;
  const url = `${currentDomain}/infoPage?sessionId=${encodeURIComponent(sessionId)}&uuid=${encodeURIComponent(uuid)}`; // QR 코드로 연결할 URL

  return (
    
    <div className="qr-code">
      <QRCode value={url} size={256} />
    </div>
  );
};

export default QRCodeComponent;
