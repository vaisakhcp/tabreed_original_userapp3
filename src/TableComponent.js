import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button, Modal, Typography, useMediaQuery, List, Divider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import SignaturePad from 'react-signature-canvas';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

const TableComponent = ({ collectionName, rowLabels, columnLabels, defaultRows, updateData, calculateClosingStock, additionalTableData, handleAdditionalTableChange }) => {
  const [rows, setRows] = useState(defaultRows || []);
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const [currentRow, setCurrentRow] = useState(null);
  const [currentColumn, setCurrentColumn] = useState(null);
  const sigPadRef = useRef(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const flattenedData = data.map(item => {
          const flattenedItem = {};
          Object.keys(item).forEach(key => {
            if (typeof item[key] === 'object') {
              Object.keys(item[key]).forEach(subKey => {
                flattenedItem[subKey] = item[key][subKey];
              });
            } else {
              flattenedItem[key] = item[key];
            }
          });
          return flattenedItem;
        });
        setRows(flattenedData);
      } catch (error) {
        console.error(`Error fetching data for ${collectionName}:`, error);
      }
    };
    fetchData();
  }, [collectionName, defaultRows]);

  useEffect(() => {
    updateData(collectionName, rows);
  }, [rows, updateData, collectionName]);

  const handleChange = (e, rowIndex, columnKey) => {
    const newRows = [...rows];
    if (!newRows[rowIndex]) {
      newRows[rowIndex] = {};
    }
    newRows[rowIndex][columnKey] = e.target.value;
    if (columnKey === 'Closing Stock (Kg)') {
      const openingStock = parseFloat(newRows[rowIndex]['Opening Stock (Kg)'] || 0);
      const closingStock = parseFloat(newRows[rowIndex]['Closing Stock (Kg)'] || 0);
      newRows[rowIndex]['Consumption (Kg)'] = openingStock - closingStock;
    }
    setRows(newRows);
  };

  const handleOpenSignatureModal = (rowIndex, columnKey) => {
    setCurrentRow(rowIndex);
    setCurrentColumn(columnKey);
    setOpenSignatureModal(true);
  };

  const handleSign = async () => {
    const signatureDataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
    const newRows = [...rows];
    if (!newRows[currentRow]) {
      newRows[currentRow] = {};
    }
    newRows[currentRow][currentColumn] = signatureDataUrl;
    setRows(newRows);

    const rowDoc = doc(db, collectionName, newRows[currentRow].id || rowLabels[currentRow]);
    await setDoc(rowDoc, newRows[currentRow]);

    setOpenSignatureModal(false);
  };

  const handleDateChange = (date, rowIndex) => {
    const newRows = [...rows];
    newRows[rowIndex]['Day'] = date;
    setRows(newRows);
  };

  return (
    <>
      {isMobile ? (
        <List>
          {rowLabels.map((rowLabel, rowIndex) => (
            <Box key={rowIndex} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>{rowLabel}</Typography>
              {columnLabels.map((col, colIndex) => (
                col !== 'Signature' && (
                  <Box key={colIndex} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ flex: 1 }}>{col}:</Typography>
                    <TextField
                      value={rows[rowIndex]?.[col] || ''}
                      onChange={(e) => handleChange(e, rowIndex, col)}
                      InputProps={{ sx: { padding: 0, height: '56px' } }}
                      sx={{ flex: 2 }}
                      variant="standard"
                      disabled={col === 'Consumption (Kg)'}
                    />
                  </Box>
                )
              ))}
              {columnLabels.includes('Signature') && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>Signature:</Typography>
                  <div
                    onClick={() => handleOpenSignatureModal(rowIndex, 'Signature')}
                    style={{ cursor: 'pointer', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 2 }}
                  >
                    {rows[rowIndex]?.['Signature'] ? (
                      <img src={rows[rowIndex]?.['Signature']} alt="Signature" style={{ width: '100px', height: '50px' }} />
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
                <TableCell sx={{ fontWeight: 'bold', fontSize: '14px', padding: '8px' }}>
                  {collectionName === 'condenserWater2' ? 'Date' : (
                    collectionName === 'condenserChemicals2' || collectionName === 'coolingTowerChemicals2' ? 'Stocks' : ''
                  )}
                </TableCell>
                {columnLabels.map((col, index) => (
                  <TableCell key={index} sx={{ fontWeight: 'bold', fontSize: '14px', padding: '8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rowLabels.map((rowLabel, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <TableRow>
                    <TableCell sx={{ padding: '8px' }}>{rowLabel}</TableCell>
                    {columnLabels.map((col, colIndex) => (
                      col === 'Signature' ? (
                        <TableCell key={colIndex} sx={{ padding: '8px', display: 'flex', justifyContent: 'center', height: '56px' }}>
                          <div
                            onClick={() => handleOpenSignatureModal(rowIndex, 'Signature')}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '56px' }}
                          >
                            {rows[rowIndex]?.['Signature'] ? (
                              <img src={rows[rowIndex]['Signature']} alt="Signature" style={{ width: '100px', height: '50px' }} />
                            ) : (
                              'Sign'
                            )}
                          </div>
                        </TableCell>
                      ) : (
                        <TableCell key={colIndex} sx={{ padding: '8px' }}>
                          {collectionName === 'chilledWater2' && col === 'Day' ? (
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                              <DatePicker
                                value={rows[rowIndex]?.[col] || null}
                                onChange={(newValue) => handleDateChange(newValue, rowIndex)}
                                renderInput={(params) => <TextField {...params} />}
                              />
                            </LocalizationProvider>
                          ) : (
                            <TextField
                              value={rows[rowIndex]?.[col] || ''}
                              onChange={(e) => handleChange(e, rowIndex, col)}
                              InputProps={{ sx: { padding: 0, height: '56px' } }}
                              disabled={col === 'Consumption (Kg)'}
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
      {collectionName === 'coolingTowerChemicals2' && additionalTableData && (
        <TableContainer component={Paper} sx={{ mt: 2, overflowX: 'auto' }}>
          <Table>
            <TableBody>
              {additionalTableData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.label}</TableCell>
                  <TableCell>
                    {index < 2 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1">10<sup></sup></Typography>
                        <TextField
                          value={item.value}
                          onChange={(e) => handleAdditionalTableChange(e, index)}
                          sx={{ width: '56px', ml: 1 }}
                          InputProps={{
                            inputProps: { style: { textAlign: 'center' } }
                          }}
                        />
                      </Box>
                    ) : (
                      <TextField
                        value={item.value}
                        onChange={(e) => handleAdditionalTableChange(e, index)}
                        fullWidth
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
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

export default TableComponent;
