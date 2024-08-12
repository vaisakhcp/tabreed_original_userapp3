import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button, Modal, Typography, IconButton, Link, Popper
} from '@mui/material';
import { collection, getDocs,getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import SignaturePad from 'react-signature-canvas';
import AddIcon from '@mui/icons-material/Add';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DeleteIcon from '@mui/icons-material/Delete';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

const CoolingTowerChemicalsComponent = ({ updateData,setTechnicianName,technicianName, noteSignature, setNoteSignature  }) => {
  const [coolingTowerChemicalsLabels, setCoolingTowerChemicalsLabels] = useState([
    { id:'Hydrochloric Acid', label: 'Hydrochloric Acid (25Kg)', value: '', action: '' },
    { id:'Sodium Hypochlorite (25Kg)',label: 'Sodium Hypochlorite (25Kg)', value: '', action: '' },
    { id:'Phosphoric Acid (35Kg)',label: 'Phosphoric Acid (35Kg)', value: '', action: '' },
    { id:'Expired CHW Chemicals',label: 'Expired CHW Chemicals', value: '', action: '' },
    { id:'Expired CT Chemicals',label: 'Expired CT Chemicals', value: '', action: '' }
  ]);
  const additionalDataTable2Order = ['Condenser water dip slide test result as of: ', 'Chilled water dip slide test result as of: ',
    'Condenser system Make-up (m³ / USG)', 'Condenser system Blowdown (m³ / USG)',
    'Chilled water system Make-up (m³ / USG)', 'C.O.C based on conductivity (Condenser/Make-up)', 'C.O.C based on (CT make-up/CT blowdown)',
  'MIOX Running Hours (Hr.)'
]
const [additionalDataTable2, setAdditionalDataTable] = useState(
  additionalDataTable2Order.map(label => ({
    id: label.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''), // Generate a unique id based on the label
    label,
    value: '',
    type: label.includes('result as of: ') ? 'date' : 'text'
  }))
);

  const [coolingTowerChemicalsSignature, setCoolingTowerChemicalsSignature] = useState('');
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const sigPadRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [selectedDateIndex, setSelectedDateIndex] = useState(null);
  const [selectedDates, setSelectedDates] = useState({});
  const [openAddProductModal, setOpenAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ label: '', value: '', action: '' });

  const handleOpenDatePicker = (event, index) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
    setSelectedDateIndex(index);
    setOpenDatePicker(true);
  };
  const handleDateChange = async (newDate) => {
    const updatedDates = { ...selectedDates, [selectedDateIndex]: newDate };
    setSelectedDates(updatedDates);
    setOpenDatePicker(false);

    // Save the selected date to Firebase
    const selectedField = additionalDataTable2[selectedDateIndex];
    await setDoc(doc(db, 'additionalDataTable2', selectedField.id), {
        ...selectedField,
        value: newDate ? newDate.toISOString() : ''  // Save as ISO string
    });
};

useEffect(() => {
  const fetchData = async () => {
      try {
          const additionalSnapshot = await getDocs(collection(db, 'additionalDataTable2'));

          // Process additional data
          const additionalData = additionalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (additionalData.length > 0) {
              const sortedAdditionalData = additionalDataTable2Order.map(label => 
                  additionalData.find(item => item.label === label) || {
                      id: label.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
                      label,
                      value: '',
                      type: label.includes('result as of: ') ? 'date' : 'text'
                  }
              );

              // Load selected dates into state
              const dates = {};
              sortedAdditionalData.forEach((item, index) => {
                  if (item.type === 'date' && item.value) {
                      dates[index] = new Date(item.value); // Parse the date correctly
                  }
              });
              setSelectedDates(dates);

              setAdditionalDataTable(sortedAdditionalData);
          }
      } catch (error) {
          console.error('Error fetching additional data:', error);
      }
  };

  fetchData();
}, []);
// Empty dependency array ensures this runs once on component mount

const [currentRow, setCurrentRow] = useState(null);

  useEffect(() => {
    updateData('additionalDataTable2', additionalDataTable2);
    updateData('coolingTowerChemicals2', coolingTowerChemicalsLabels);
  }, [coolingTowerChemicalsLabels, additionalDataTable2, updateData]);

  const handleOpenSignatureModal = () => {
    setOpenSignatureModal(true);

  };

  const handleSign = async () => {
    // const signatureDataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
    // setCoolingTowerChemicalsSignature(signatureDataUrl);
    // setOpenSignatureModal(false);

    // // Save the signature to the database
    // const docRef = doc(db, 'coolingTowerChemicals2', 'technicianInfo');
    // await setDoc(docRef, { signature: signatureDataUrl, name: technicianName });
    const signatureDataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
    setNoteSignature(signatureDataUrl);

   
    await setDoc(doc(db, 'coolingTowerChemicals2', 'technicianInfo'), {
      name: technicianName,
      signature: noteSignature
    });

    setOpenSignatureModal(false);
  };

 

  const handleValueChange = (index, value) => {
    const updatedData = [...coolingTowerChemicalsLabels];
    updatedData[index].value = value;
    setCoolingTowerChemicalsLabels(updatedData);
  };

  const handleActionChange = (index, action) => {
    const updatedData = [...coolingTowerChemicalsLabels];
    updatedData[index].action = action;
    setCoolingTowerChemicalsLabels(updatedData);
  };

  const handleAddRow = () => {
    setOpenAddProductModal(true);
  };

  const handleAddProduct = async () => {
    // Generate a unique id based on the label and a timestamp
    const newProductId = `${newProduct.label.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')}-${Date.now()}`;
  
    const newProductWithId = {
      id: newProductId,
      ...newProduct,
    };
  
    const updatedLabels = [...coolingTowerChemicalsLabels, newProductWithId];
    setCoolingTowerChemicalsLabels(updatedLabels);
  
    await setDoc(doc(db, 'coolingTowerChemicals2', newProductWithId.id), newProductWithId);
  
    setNewProduct({ label: '', value: '', action: '' });
    setOpenAddProductModal(false);
  };
  
  const handleDeleteRow = async (index) => {
    const updatedLabels = [...coolingTowerChemicalsLabels];
    const deletedItem = updatedLabels.splice(index, 1);
    setCoolingTowerChemicalsLabels(updatedLabels);
    await setDoc(doc(db, 'coolingTowerChemicals2', `product-${index + 1}`), deletedItem);
  };

  const handleAdditionalTableChange = (e, index) => {
    const newTableData = [...additionalDataTable2];
    newTableData[index].value = e.target.value;
    setAdditionalDataTable(newTableData);
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ overflowX: 'auto', mb: 3 }}>
        <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '14px', padding: '8px' }}>
                Products
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '14px', padding: '8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Value
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '14px', padding: '8px' }}>
                Actions
              </TableCell>
              <TableCell sx={{ padding: '8px' }}>
                Delete
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coolingTowerChemicalsLabels
              .filter(item => item.id !== 'metadata' && item.id !== 'technicianInfo'&& item.id !== 'signature'&& item.id !== 'technicianName')
              .map((item, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell sx={{ padding: '8px' }}>
                  <Typography>{item.label}</Typography>
                </TableCell>
                <TableCell sx={{ padding: '8px' }}>
                  <TextField
                    value={item.value}
                    onChange={(e) => handleValueChange(rowIndex, e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell sx={{ padding: '8px' }}>
                  <TextField
                    value={item.action}
                    onChange={(e) => handleActionChange(rowIndex, e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell sx={{ padding: '8px', display: 'flex', justifyContent: 'center' }}>
                  <IconButton onClick={() => handleDeleteRow(rowIndex)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={4}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddRow}
                  fullWidth
                >
                  Add Row
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <TableContainer component={Paper} sx={{ mt: 2, overflowX: 'auto' }}>
        <Table>
          <TableBody>
            {additionalDataTable2.map((item, index) => (
              <TableRow key={index}>
                
                <TableCell>
                  {item.label}
                  {item.type === 'date' && (
                    <Link href="#" onClick={(event) => handleOpenDatePicker(event, index)}>
                      {selectedDates[index] ? selectedDates[index].toLocaleDateString() : 'Select Date'}
                    </Link>
                  )}
                </TableCell>
                <TableCell>
                  {item.type === 'date' ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">10<sup></sup></Typography>
                      <TextField
                       value={item.value}
                       onChange={(e) => {
                         const newTableData = [...additionalDataTable2];
                         newTableData[index].value = e.target.value;
                         setAdditionalDataTable(newTableData);
                        }}
                        sx={{width:50}}
                       fullWidth
                      />
                    </Box>
                  ) : (
                    <TextField
                      value={item.value}
                      onChange={(e) => {
                        const newTableData = [...additionalDataTable2];
                        newTableData[index].value = e.target.value;
                        setAdditionalDataTable(newTableData);
                      }}
                      fullWidth
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Popper open={openDatePicker} anchorEl={anchorEl}>
        <Paper>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              value={selectedDates[selectedDateIndex] || null}
              onChange={handleDateChange}
              renderInput={(params) => <TextField {...params} />}
            />
          </LocalizationProvider>
        </Paper>
      </Popper>
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
          onClick={handleOpenSignatureModal}
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

      <Modal
        open={openAddProductModal}
        onClose={() => setOpenAddProductModal(false)}
        aria-labelledby="add-product-modal-title"
        aria-describedby="add-product-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography id="add-product-modal-title" variant="h6" component="h2" gutterBottom>
            Add New Product
          </Typography>
          <TextField
            label="Product Label"
            value={newProduct.label}
            onChange={(e) => setNewProduct({ ...newProduct, label: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Value"
            value={newProduct.value}
            onChange={(e) => setNewProduct({ ...newProduct, value: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Action"
            value={newProduct.action}
            onChange={(e) => setNewProduct({ ...newProduct, action: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="primary" onClick={handleAddProduct} sx={{ mt: 2 }}>
            Add Product
          </Button>
        </Box>
      </Modal>
    </>
  );
};

export default CoolingTowerChemicalsComponent;
