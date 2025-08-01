import React, { memo, useState } from 'react';
import CanvasImageRenderer from './CanvasImageRenderer';
import FullscreenImageModal from './FullscreenImageModal';

const Message = memo(({ msg, mySocketId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
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
            <CanvasImageRenderer imageData={msg.image} onClick={handleImageClick} />
          ) : (
            <div>{msg.text ?? '[no text]'}</div>
          )}

          {msg.timestamp && (msg.text || msg.image) && (
            <div className="timestamp">{msg.timestamp}</div>
          )}
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {msg.type?.startsWith('image') && (
        <FullscreenImageModal
          isOpen={isModalOpen}
          imageData={msg.image}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
});

Message.displayName = 'Message';

export default Message;