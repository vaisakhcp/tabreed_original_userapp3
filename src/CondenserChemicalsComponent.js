import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import SignaturePad from 'react-signature-canvas';
import {
  Box, TextField, Button, Modal, Typography, useMediaQuery, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, List, Divider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

const CondenserChemicalsComponent = ({ updateData, technicianName, setTechnicianName, noteSignature, setNoteSignature }) => {
  const [condenserChemicalsData, setCondenserChemicalsData] = useState([]);
  const condenserChemicalsLabels = [
    'PM3601 (25Kg)', 'Biocide AQ', 'PF CC6202 (20Kg)', 'PDV Salt (25Kg)', 'Sodium Hypochlorite (25 kg)',
    'BD 250C (25Kg)', 'PF CL4015 (CHW)', 'BD 350 (30Kg)', 'Dip slide (pcs)'
  ];
  const condenserChemicalsColumns = ['Opening Stock (Kg)', 'Closing Stock (Kg)', 'Consumption (Kg)'];
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const sigPadRef = useRef(null);
  const isMobile = useMediaQuery('(max-width:600px)');
  const [currentRow, setCurrentRow] = useState(null);
  const [currentColumn, setCurrentColumn] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'condenserChemicals2'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCondenserChemicalsData(data);

        const docRef = doc(db, 'condenserChemicals2', 'metadata');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const { name, signature } = docSnap.data();
          setTechnicianName(name || '');
          setNoteSignature(signature || '');
        }
      } catch (error) {
        console.error('Error fetching condenser chemicals data:', error);
      }
    };
    fetchData();
  }, [setTechnicianName, setNoteSignature]);

  useEffect(() => {
    updateData('condenserChemicals2', condenserChemicalsData);
  }, [condenserChemicalsData, updateData]);

  const openLocalSignatureModal = (rowIndex, columnKey) => {
    setCurrentRow(rowIndex);
    setCurrentColumn(columnKey);
    setOpenSignatureModal(true);
  };

  const handleSign = async () => {
    const signatureDataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
    setNoteSignature(signatureDataUrl);

    await setDoc(doc(db, 'condenserChemicals2', 'metadata'), {
      name: technicianName,
      signature: signatureDataUrl,
    });

    if (currentRow !== null && currentColumn !== null) {
      const newData = [...condenserChemicalsData];
      newData[currentRow][currentColumn] = signatureDataUrl;
      setCondenserChemicalsData(newData);
    }

    const completeData = condenserChemicalsData.map((row, index) => ({
      ...row,
      label: condenserChemicalsLabels[index],
    }));

    await setDoc(doc(db, 'condenserChemicals2', 'condenserChemicalsData'), {
      data: completeData,
    });

    setOpenSignatureModal(false);
  };

  const handleChange = (e, rowIndex, columnKey) => {
    const newData = [...condenserChemicalsData];
    if (!newData[rowIndex]) {
      newData[rowIndex] = {};
    }
    newData[rowIndex][columnKey] = e.target.value;
    if (columnKey === 'Closing Stock (Kg)') {
      const openingStock = parseFloat(newData[rowIndex]['Opening Stock (Kg)'] || 0);
      const closingStock = parseFloat(newData[rowIndex]['Closing Stock (Kg)'] || 0);
      newData[rowIndex]['Consumption (Kg)'] = openingStock - closingStock;
    }
    setCondenserChemicalsData(newData);
  };

  const handleDateChange = (date, rowIndex) => {
    const newData = [...condenserChemicalsData];
    newData[rowIndex]['Day'] = date;
    setCondenserChemicalsData(newData);
  };

  return (
    <>
      {isMobile ? (
        <List>
          {condenserChemicalsLabels.map((rowLabel, rowIndex) => (
            <Box key={rowIndex} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>{rowLabel}</Typography>
              {condenserChemicalsColumns.map((col, colIndex) => (
                col !== 'Signature' && (
                  <Box key={colIndex} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ flex: 1 }}>{col}:</Typography>
                    <TextField
                      value={condenserChemicalsData[rowIndex]?.[col] || ''}
                      onChange={(e) => handleChange(e, rowIndex, col)}
                      InputProps={{ sx: { padding: 0, height: '56px' } }}
                      sx={{ flex: 2 }}
                      variant="standard"
                      disabled={col === 'Consumption (Kg)'}
                    />
                  </Box>
                )
              ))}
              {condenserChemicalsColumns.includes('Signature') && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>Signature:</Typography>
                  <div
                    onClick={() => openLocalSignatureModal(rowIndex, 'Signature')}
                    style={{ cursor: 'pointer', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 2 }}
                  >
                    {condenserChemicalsData[rowIndex]?.['Signature'] ? (
                      <img src={condenserChemicalsData[rowIndex]?.['Signature']} alt="Signature" style={{ width: '100px', height: '50px' }} />
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
                <TableCell sx={{ fontWeight: 'bold', fontSize: '14px', padding: '8px' }}>Stocks</TableCell>
                {condenserChemicalsColumns.map((col, index) => (
                  <TableCell key={index} sx={{ fontWeight: 'bold', fontSize: '14px', padding: '8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {condenserChemicalsLabels.map((rowLabel, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <TableRow>
                    <TableCell sx={{ padding: '8px' }}>{rowLabel}</TableCell>
                    {condenserChemicalsColumns.map((col, colIndex) => (
                      col === 'Signature' ? (
                        <TableCell key={colIndex} sx={{ padding: '8px', display: 'flex', justifyContent: 'center', height: '56px' }}>
                          <div
                            onClick={() => openLocalSignatureModal(rowIndex, 'Signature')}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '56px' }}
                          >
                            {condenserChemicalsData[rowIndex]?.['Signature'] ? (
                              <img src={condenserChemicalsData[rowIndex]['Signature']} alt="Signature" style={{ width: '100px', height: '50px' }} />
                            ) : (
                              'Sign'
                            )}
                          </div>
                        </TableCell>
                      ) : (
                        <TableCell key={colIndex} sx={{ padding: '8px' }}>
                          <TextField
                            value={condenserChemicalsData[rowIndex]?.[col] || ''}
                            onChange={(e) => handleChange(e, rowIndex, col)}
                            InputProps={{ sx: { padding: 0, height: '56px' } }}
                            disabled={col === 'Consumption (Kg)'}
                          />
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
          onClick={() => openLocalSignatureModal(null, 'Signature')}
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

export default CondenserChemicalsComponent;
