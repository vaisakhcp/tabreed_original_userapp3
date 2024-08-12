// src/PromptInstall.js
import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Modal } from '@mui/material';

const PromptInstall = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    if (
      /iPhone|iPad|iPod/.test(navigator.userAgent) &&
      !navigator.standalone
    ) {
      setShowInstallPrompt(true);
    }
  }, []);

  return (
    <Modal
      open={showInstallPrompt}
      onClose={() => setShowInstallPrompt(false)}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 300, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4 }}>
        <Typography id="modal-title" variant="h6" component="h2">
          Install App
        </Typography>
        <Typography id="modal-description" sx={{ mt: 2 }}>
          To install this app, open the browser menu and select "Add to Home Screen".
        </Typography>
        <Button onClick={() => setShowInstallPrompt(false)}>Close</Button>
      </Box>
    </Modal>
  );
};

export default PromptInstall;
