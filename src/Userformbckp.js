import React, { useEffect, useState, useRef } from 'react';
import {
  Container, Box, Tabs, Tab, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  createTheme, ThemeProvider, Modal, Typography, Grid, useMediaQuery,
  List, ListItem, ListItemText, IconButton, Divider, Chip, Fab, CircularProgress, Backdrop
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { collection, getDocs, setDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import SignaturePad from 'react-signature-canvas';
import logo from './logo.png';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'; // Use dayjs adapter

import dayjs from 'dayjs'; // Import   

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    background: { default: '#f8f9fa', paper: '#fff' },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
    h5: { fontSize: '1.5rem' },
    h6: { fontSize: '1.2rem' },
    body1: { fontSize: '0.9rem' },
    body2: { fontSize: '0.8rem' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          textTransform: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: '16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: '20px',
          borderRadius: '10px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '8px',
          fontSize: '14px',
        },
        head: {
          fontWeight: 'bold',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        subtitle1: {
          fontWeight: 'bold',
          color: '#666',
        },
        subtitle2: {
          fontWeight: 'bold',
          color: '#999',
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#1976d2' },
    background: { default: '#424242', paper: '#333' },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
    h5: { fontSize: '1.5rem' },
    h6: { fontSize: '1.2rem' },
    body1: { fontSize: '0.9rem' },
    body2: { fontSize: '0.8rem' },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '8px',
          fontSize: '14px',
        },
        head: {
          fontWeight: 'bold',
        },
      },
    },
  },
});

const TabPanel = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const TableComponent = ({ collectionName, rowLabels, columnLabels, defaultRows, updateData, calculateClosingStock }) => {
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
        console.log(`Fetched data for ${collectionName}:`, data);
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
    if (calculateClosingStock && columnKey !== 'Closing Stock (Kg)') {
      const openingStock = parseFloat(newRows[rowIndex]['Opening Stock (Kg)'] || 0);
      const consumption = parseFloat(newRows[rowIndex]['Consumption (Kg)'] || 0);
      newRows[rowIndex]['Closing Stock (Kg)'] = openingStock - consumption;
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
    console.log(`Saving signature document in ${collectionName} collection:`, newRows[currentRow]);
    await setDoc(rowDoc, newRows[currentRow]);

    setOpenSignatureModal(false);
  };

  const handleDateChange = (date, rowIndex) => {
    const newRows = [...rows];
    newRows[rowIndex]['Day'] = date; // Update the 'Day' field in the row data
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
                      disabled={col === 'Closing Stock (Kg)'}
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
                              disabled={col === 'Closing Stock (Kg)'}
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

const Userform = () => {
  const [weekCommencing, setWeekCommencing] = useState(dayjs().startOf('week'));

  // Calculate week start (Sunday) and end (Saturday)
  const weekStart = weekCommencing.startOf('week').format('Do MMMM YYYY');
  const weekEnd = weekCommencing.endOf('week').format('Do MMMM YYYY');
    
  const handleDateChange = (date) => {
    setWeekCommencing(dayjs(date).startOf('week')); // Set to start of week (Sunday)
  };

  const [isLoading, setIsLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [reportDate, setReportDate] = useState(new Date());
  const [revisionDate, setRevisionDate] = useState(new Date());
  const [technicianName, setTechnicianName] = useState('');
  const [technicianNameChilled, setTechnicianNameChilled] = useState('');
  const [technicianNameChemicals, setTechnicianNameChemicals] = useState('');
  const [notes, setNotes] = useState('');
  const [noteList, setNoteList] = useState([]);
  const [noteName, setNoteName] = useState('');
  const [noteSignature, setNoteSignature] = useState('');
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const sigPadRef = useRef(null);

  useEffect(() => {
    const fetchNotes = async () => {
      const notesSnapshot = await getDocs(collection(db, 'notes2'));
      const notesData = notesSnapshot.docs.map(doc => doc.data().notes);
      setNoteList(notesData.flat()); // Flatten the array if notes is an array of arrays
    };

    fetchNotes();
  }, []);

  const [noteInput, setNoteInput] = useState('');
  const [condenserWaterData, setCondenserWaterData] = useState([]);
  const [chilledWaterData, setChilledWaterData] = useState([]);
  const [condenserChemicalsData, setCondenserChemicalsData] = useState([]);
  const [coolingTowerChemicalsData, setCoolingTowerChemicalsData] = useState([]);
  const [additionalTableData, setAdditionalTableData] = useState([
    { label: 'Condenser water dip slide test result as of: 30th October 2022', value: '', color: 'blue' },
    { label: 'Chilled water dip slide test result as of: 02nd November 2022', value: '', color: 'blue' },
    { label: 'Condenser system Make-up (m³ / USG)', value: '', color: 'red' },
    { label: 'Condenser system Blowdown (m³ / USG)', value: '', color: 'red' },
    { label: 'Chilled water system Make-up (m³ / USG)', value: '', color: 'red' },
    { label: 'C.O.C based on conductivity (Condenser/Make-up)', value: '', color: 'blue' },
    { label: 'C.O.C based on (CT make-up/CT blowdown)', value: '', color: 'blue' },
    { label: 'MIOX Running Hours (Hr.)', value: '', color: 'black' },
  ]);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
  };

  const handleAddNote = () => {
    if (noteInput.trim()) {
      setNoteList([...noteList, noteInput.trim()]);
      setNoteInput('');
    }
  };

  const handleDeleteNote = (index) => {
    const newList = noteList.filter((_, i) => i !== index);
    setNoteList(newList);
  };

  const handleSaveNotes = async () => {
    const notesDoc = doc(db, 'notes2', 'noteList');
    await setDoc(notesDoc, { notes: noteList });
  };

  const handleAdditionalTableChange = (e, index) => {
    const newTableData = [...additionalTableData];
    newTableData[index].value = e.target.value;
    setAdditionalTableData(newTableData);
  };

  const handleSaveAdditionalTable = async () => {
    const additionalDataDoc = doc(db, 'additionalTable', 'additionalTableData');
    await setDoc(additionalDataDoc, { data: additionalTableData });
  };

  const handleClearAllData = async () => {
    setIsLoading(true);
  
    try {
      // Clear data from Firebase
      await clearCollectionData('condenserWater2');
      await clearCollectionData('chilledWater2');
      await clearCollectionData('condenserChemicals2');
      await clearCollectionData('coolingTowerChemicals2');
  
      // Clear local state
      setCondenserWaterData(condenserWaterLabels.map(label => ({})));
      setChilledWaterData(chilledWaterLabels.map(label => ({})));
      setCondenserChemicalsData(condenserChemicalsLabels.map(label => ({})));
      setCoolingTowerChemicalsData(coolingTowerChemicalsLabels.map(label => ({})));
      setAdditionalTableData(additionalTableData.map(item => ({ ...item, value: '' })));
  
      toast.success('Data cleared successfully!');
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Error clearing data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const clearCollectionData = async (collectionName) => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error(`Error   
   clearing data from ${collectionName}:`, error);
      // You might want to re-throw the error here or handle it in a more specific way
    }
  }
  const updateData = (collectionName, data) => {
    switch (collectionName) {
      case 'condenserWater2':
        setCondenserWaterData(data);
        console.log('condenserWater2', data);
        break;
      case 'chilledWater2':
        setChilledWaterData(data);
        break;
      case 'condenserChemicals2':
        setCondenserChemicalsData(data);
        break;
      case 'coolingTowerChemicals2':
        setCoolingTowerChemicalsData(data);
        break;
      default:
        break;
    }
  };
  const [ isOverlayModalOpen, setIsOverlayModalOpen] = React.useState(false)
  const handleSaveAllData = async (params) => {
    setIsLoading(true);
    const plantName = "AD-008"; // Plant name
    try {
      const chilledWaterDataWithId = chilledWaterData.map(item => ({
        ...item,
        id: item.id || doc(collection(db, 'chilledWater2')).id  // Use existing ID or generate a new one
      }));
      await handleSaveData('condenserWater2', condenserWaterData, condenserWaterLabels, plantName);
      await handleSaveData('chilledWater2', chilledWaterDataWithId, chilledWaterLabels, plantName); // Pass as array
      await handleSaveData('condenserChemicals2', condenserChemicalsData, condenserChemicalsLabels, plantName);
      await handleSaveData('coolingTowerChemicals2', coolingTowerChemicalsData, coolingTowerChemicalsLabels, plantName);
      await handleSaveAdditionalTable();
      await handleSaveNotes();

      toast.success('Report submitted successfully!'); 
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Error submitting report. Please try again.');
    } finally {
      setIsLoading(false);
    }

    if (params === 'exit') {
      setIsOverlayModalOpen(true);
    }
   
  };

  const handleSaveData = async (collectionName, data, rowLabels) => {
      if (!Array.isArray(data)) {
      data = [data]; // Convert to an array if it is not
    }

    for (const row of data) {
      const rowDoc = doc(db, collectionName, row.id || rowLabels[data.indexOf(row)]);
      await setDoc(rowDoc, row);
    }
  };

  const handleOpenSignatureModal = () => {
    setOpenSignatureModal(true);
  };

  const handleSign = async () => {
    const signatureDataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
    setNoteSignature(signatureDataUrl);
    setOpenSignatureModal(false);
  };

  const condenserWaterLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const condenserWaterColumns = ['Makeup Conductivity', 'Condenser Conductivity', 'Free Chlorine', 'Action', 'Name', 'Signature'];

  const chilledWaterLabels = [new Date().toLocaleDateString()];
  const chilledWaterColumns = ['Day', 'Conductivity', 'Action'];
  const chilledWaterDefaultRow = [{
    'Day': new Date().toLocaleDateString(),
    'Conductivity': '',
    'Name': '',
    'Signature': ''
  }];
  const condenserChemicalsLabels = [
    'PM3601 (25Kg)', 'Biocide AQ', 'PF CC6202 (20Kg)', 'PDV Salt (25Kg)', 'Sodium Hypochlorite (25 kg)',
    'BD 250C (25Kg)', 'PF CL4015 (CHW)', 'BD 350 (30Kg)', 'Dip slide (pcs)'
  ];
  const condenserChemicalsColumns = ['Opening Stock (Kg)', 'Consumption (Kg)', 'Closing Stock (Kg)'];
  const condenserChemicalsDefaultRows = [
    { 'Product Name': 'PM3601 (25Kg)', 'Opening Stock (Kg)': 100, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 100 },
    { 'Product Name': 'Biocide AQ', 'Opening Stock (Kg)': 200, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 200 },
    { 'Product Name': 'PF CC6202 (20Kg)', 'Opening Stock (Kg)': 150, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 150 },
    { 'Product Name': 'PDV Salt (25Kg)', 'Opening Stock (Kg)': 300, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 300 },
    { 'Product Name': 'Sodium Hypochlorite (25 kg)', 'Opening Stock (Kg)': 250, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 250 },
    { 'Product Name': 'BD 250C (25Kg)', 'Opening Stock (Kg)': 180, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 180 },
    { 'Product Name': 'PF CL4015 (CHW)', 'Opening Stock (Kg)': 120, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 120 },
    { 'Product Name': 'BD 350 (30Kg)', 'Opening Stock (Kg)': 90, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 90 },
    { 'Product Name': 'Dip slide (pcs)', 'Opening Stock (Kg)': 60, 'Consumption (Kg)': '', 'Closing Stock (Kg)': 60 }
  ];

  const coolingTowerChemicalsLabels = [
    'Hydrochloric Acid (25Kg)', 'Sodium Hypochlorite (25Kg)', 'Phosphoric Acid (35Kg)',
    'Expired CHW Chemicals', 'Expired CT Chemicals'
  ];
  const coolingTowerChemicalsColumns = ['Available empty Jerry Cans in plants (06-11-2022)'];


  return (
    <ThemeProvider theme={theme}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Container component={Paper} sx={{ p: 3, mt: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <img src={logo} alt="Logo" style={{ width: isMobile ? '50%' : '150px', marginBottom: '5px' }} />
          <Typography variant={isMobile ? 'h6' : 'h5'} component="h1">
            Water Treatment Weekly Report
          </Typography>
          <Grid item xs={12} sm={8} md={6}> {/* Adjust column width based on screen size */}
              <Typography variant="subtitle1" component="h2">
                Week Commencing Sunday : {weekStart} to {weekEnd}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4} md={3} marginTop={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={weekCommencing}
                  onChange={handleDateChange}
                  label="Select Week"
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
          <Chip label="Plant Name: AD-008" color="primary" size="small" sx={{ mt: 0.5 }} />
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Operations Department: TOM-OPS-FM-2009</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Revision 03 Dated: 25/10/2021</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Replaces Revision 02 of: 19/03/2005</Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'right', mb: 3 }}>
          <Button variant="contained" color="primary" onClick={handleSaveAllData}>
            Submit report
          </Button>
          <Button variant="contained" color="error" onClick={handleClearAllData}>
            Clear Data
          </Button>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabIndex} onChange={handleTabChange} centered variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
            <Tab label="Condenser Water" />
            <Tab label="Chilled Water" />
            <Tab label="Condenser Chemicals" />
            <Tab label="Cooling Tower Chemicals" />
            <Tab label="Notes" />
          </Tabs>
        </Box>
        <TabPanel value={tabIndex} index={0}>
          <TableComponent
            collectionName="condenserWater2"
            rowLabels={condenserWaterLabels}
            columnLabels={condenserWaterColumns}
            updateData={updateData}
          />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <TableComponent
            collectionName="chilledWater2"
            rowLabels={chilledWaterLabels}
            columnLabels={chilledWaterColumns}
            updateData={updateData}
          />
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 3 }}>
            <TextField
              label="Name"
              value={technicianNameChilled}
              onChange={(e) => setTechnicianNameChilled(e.target.value)}
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
        </TabPanel>
        <TabPanel value={tabIndex} index={2}>
          <TableComponent
            collectionName="condenserChemicals2"
            rowLabels={condenserChemicalsLabels}
            columnLabels={condenserChemicalsColumns}
            updateData={updateData}
            defaultRows={condenserChemicalsDefaultRows}
          />
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 3 }}>
            <TextField
              label="Name"
              value={technicianNameChemicals}
              onChange={(e) => setTechnicianNameChemicals(e.target.value)}
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
        </TabPanel>
        <TabPanel value={tabIndex} index={3}>
          <TableComponent
            collectionName="coolingTowerChemicals2"
            rowLabels={coolingTowerChemicalsLabels}
            columnLabels={coolingTowerChemicalsColumns}
            updateData={updateData}
          />
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
        </TabPanel>
        <TabPanel value={tabIndex} index={4}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Notes</Typography>
            <List>
              {noteList.map((note, index) => (
                <ListItem key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <ListItemText primary={note} />
                  <IconButton edge="end" onClick={() => handleDeleteNote(index)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              ))}
              <ListItem>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add a note"
                />
                <IconButton color="primary" onClick={handleAddNote}>
                  <AddIcon />
                </IconButton>
              </ListItem>
            </List>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 3 }}>
              <TextField
                label="Name"
                value={noteName}
                onChange={(e) => setNoteName(e.target.value)}
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
          </Box>
        </TabPanel>
      </Container>
      <Button
  variant="contained"
  color="primary"
  startIcon={<SaveIcon />}
  onClick={()=>handleSaveAllData('exit')}
  sx={{
    position: 'fixed',
    bottom: 16,
    right: 16,
    borderRadius: '4px', // Optional: customize border radius
    padding: '8px 16px', // Optional: customize padding
  }}
>
  Save and Exit
</Button>
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
            border: '2px solid #000',
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
  open={isOverlayModalOpen}
  onClose={() => setIsOverlayModalOpen(false)}
  aria-labelledby="overlay-modal-title"
  aria-describedby="overlay-modal-description"
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
      borderRadius: '10px',
      boxShadow: 24,
      p: 4,
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}
  >
    <img src={logo} alt="Logo" style={{ width: '120px', marginBottom: '20px' }} />
    <Typography id="overlay-modal-title" variant="h5" component="h2" gutterBottom>
      Thank You for Visiting Tabreed
    </Typography>
    <Typography variant="body1" color="textSecondary">
      Your data has been successfully saved.
    </Typography>
    <Button
      variant="contained"
      color="primary"
      sx={{ mt: 3 }}
      onClick={() => setIsOverlayModalOpen(false)}
    >
      Close
    </Button>
  </Box>
</Modal>

      <ToastContainer /> 
    </ThemeProvider>
  );
};

export default Userform;
