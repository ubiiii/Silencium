import React, { memo } from 'react';
import CanvasImageRenderer from './CanvasImageRenderer';

const Message = memo(({ msg, mySocketId }) => {
  return (
    <div
      className={`message-row ${
        msg.sender === mySocketId
          ? 'align-right'
          : msg.sender && msg.sender !== 'system'
          ? 'align-left'
          : 'align-center'
      }`}
    >
      <div className={`message-bubble ${msg.sender === 'system' ? 'system-msg' : 'user-msg'}`}>
        {msg.type?.startsWith('image') ? (
          <CanvasImageRenderer imageData={msg.image} />
        ) : (
          <div>{msg.text ?? '[no text]'}</div>
        )}

        {msg.timestamp && (msg.text || msg.image) && (
          <div className="timestamp">{msg.timestamp}</div>
        )}
      </div>
    </div>
  );
});

Message.displayName = 'Message';

export default Message;