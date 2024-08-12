import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import SignaturePad from 'react-signature-canvas';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button, Modal, Typography, useMediaQuery, Divider, List
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';

const ChilledWaterComponent = ({ updateData, technicianName, setTechnicianName,chilledWaterSignature, handleOpenSignatureModal }) => {
  const [chilledWaterData, setChilledWaterData] = useState([]);
  const chilledWaterLabels = [new Date().toLocaleDateString('en-GB')];
  const chilledWaterColumns = ['Day', 'Conductivity(µS/cm)', 'Action'];
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const [currentRow, setCurrentRow] = useState(null);
  const [currentColumn, setCurrentColumn] = useState(null);
  const sigPadRef = useRef(null);
  const isMobile = useMediaQuery('(max-width:600px)');
  const [noteSignature, setNoteSignature] = useState('');
  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'chilledWater2'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Find the name and signature data
        const nameData = data.find(item => item.id === 'technicianInfo');
        if (nameData) {
          setTechnicianName(nameData.name || '');
          setNoteSignature(nameData.signature || '');
        }
  
        // Store the rest of the data
        setChilledWaterData(data.filter(item => item.id !== 'technicianInfo'));
      } catch (error) {
        console.error('Error fetching chilled water data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    updateData('chilledWater2', chilledWaterData);
  }, [chilledWaterData, updateData]);

  const handleChange = (e, rowIndex, columnKey) => {
    setChilledWaterData(prevData => {
      const newData = [...prevData];
      
      // Ensure the row exists before updating
      if (!newData[rowIndex]) {
        newData[rowIndex] = { id: `row_${rowIndex}` }; // Ensure consistent ID if row doesn't exist
      }
  
      // Replace the content at the specific cell
      newData[rowIndex][columnKey] = e.target.value;
      return newData;
    });
  };

  const openLocalSignatureModal = (rowIndex, columnKey) => {
    setCurrentRow(rowIndex);
    setCurrentColumn(columnKey);
    setOpenSignatureModal(true);
  };

  const handleSign = async () => {
    const signatureDataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
    setNoteSignature(signatureDataUrl);
    setOpenSignatureModal(false);

    // Save the updated name and signature to Firestore
    try {
      await setDoc(doc(db, 'chilledWater2', 'technicianInfo'), {
        name: technicianName,
        signature: signatureDataUrl
      });
    } catch (error) {
      console.error('Error saving signature:', error);
    }
  };


  const handleDateChange = (date, rowIndex) => {
    const formattedDate = format(date, 'dd/MM/yyyy'); // Format date as DD/MM/YYYY
    setChilledWaterData(prev => {
      const newData = [...prev];
      newData[rowIndex] = { ...newData[rowIndex], Day: formattedDate };
      return newData;
    });
  };
  return (
    <>
      {isMobile ? (
        <List>
          {chilledWaterLabels.map((rowLabel, rowIndex) => (
            <Box key={rowIndex} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>{rowLabel}</Typography>
              {chilledWaterColumns.map((col, colIndex) => (
                col !== 'Signature' && (
                  <Box key={colIndex} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ flex: 1 }}>{col}:</Typography>
                    <TextField
                      value={chilledWaterData[rowIndex]?.[col] || ''}
                      onChange={(e) => handleChange(e, rowIndex, col)}
                      InputProps={{ sx: { padding: 0, height: '56px' } }}
                      sx={{ flex: 2 }}
                      variant="standard"
                    />
                  </Box>
                )
              ))}
              {chilledWaterColumns.includes('Signature') && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>Signature:</Typography>
                  <div
                    onClick={() => openLocalSignatureModal(rowIndex, 'Signature')}
                    style={{ cursor: 'pointer', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 2 }}
                  >
                    {chilledWaterData[rowIndex]?.['Signature'] ? (
                      <img src={chilledWaterData[rowIndex]?.['Signature']} alt="Signature" style={{ width: '100px', height: '50px' }} />
                    ) : (
                      'Sign'
                    )}
                  </div>
                </Box>
              )}
              <Divider />
            </Box>
          ))}
        </List>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto', mb: 3 }}>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                {chilledWaterColumns.map((col, index) => (
                  <TableCell key={index} sx={{ fontWeight: 'bold', fontSize: '14px', padding: '8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {chilledWaterLabels.map((rowLabel, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <TableRow>
                    {chilledWaterColumns.map((col, colIndex) => (
                      col === 'Signature' ? (
                        <TableCell key={colIndex} sx={{ padding: '8px', display: 'flex', justifyContent: 'center', height: '56px' }}>
                          <div
                            onClick={() => openLocalSignatureModal(rowIndex, 'Signature')}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '56px' }}
                          >
                          
                          {chilledWaterSignature ? (
      <img src={chilledWaterSignature} alt="Signature" style={{ width: '100px', height: '50px' }} />
    ) : (
      'Sign'
    )}
                          </div>
                        </TableCell>
                      ) : (
                          <TableCell key={colIndex} sx={{ padding: '8px' }}>
                         {col === 'Day' ? (
  <LocalizationProvider dateAdapter={AdapterDateFns}>
  <DatePicker
  value={chilledWaterData[rowIndex]?.[col] ? new Date(chilledWaterData[rowIndex][col].split('/').reverse().join('-')) : null}
  onChange={(newValue) => handleDateChange(newValue, rowIndex)}
  renderInput={(params) => (
    <TextField
      {...params}
      inputProps={{ ...params.inputProps, readOnly: true }} // Disable typing
    />
  )}
  inputFormat="dd/MM/yyyy" // Set the input format to DD/MM/YYYY
/>

  </LocalizationProvider>
) : (
  <TextField
    value={chilledWaterData[rowIndex]?.[col] || ''}
    onChange={(e) => handleChange(e, rowIndex, col)}
    InputProps={{ sx: { padding: 0, height: '56px' } }}
  />
)}
                        </TableCell>
                      )
                    ))}
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 3 }}>
        <TextField
          label="Name"
          value={technicianName}
          onChange={(e) => setTechnicianName(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px solid lightgrey',
            cursor: 'pointer',
            height: '50px',
          }}
          onClick={() => handleOpenSignatureModal('chilledWater2')}
        >
          {noteSignature ? (
            <img src={noteSignature} alt="Signature" style={{ width: '100px', height: '50px' }} />
          ) : (
            'Sign'
          )}
        </Box>
      </Box>
      <Modal
        open={openSignatureModal}
        onClose={() => setOpenSignatureModal(false)}
        aria-labelledby="signature-modal-title"
        aria-describedby="signature-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 600,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography id="signature-modal-title" variant="h6" component="h2" gutterBottom>
            Signature
          </Typography>
          <Box sx={{ width: '100%', height: 200, border: '1px solid #000' }}>
            <SignaturePad ref={sigPadRef} canvasProps={{ style: { width: '100%', height: '100%' } }} />
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="contained" color="primary" onClick={handleSign}>
              Sign
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ChilledWaterComponent;
