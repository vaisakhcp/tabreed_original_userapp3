import React, { useEffect, useState, useRef } from 'react';
import {
  Container, Box, Tabs, Tab, Paper, TextField, Button, Chip,
  Typography, Grid, CircularProgress, Backdrop, useMediaQuery, Modal
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { getDocs, setDoc, doc, collection, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import logo from './logo.png';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SaveIcon from '@mui/icons-material/Save';
import CondenserWaterComponent from './CondenserWaterComponent';
import ChilledWaterComponent from './ChilledWaterComponent';
import CondenserChemicalsComponent from './CondenserChemicalsComponent';
import CoolingTowerChemicalsComponent from './CoolingTowerChemicalsComponent';
import NotesComponent from './NotesComponent';
import dayjs from 'dayjs';
import SignaturePad from 'react-signature-canvas';
import 'dayjs/locale/en-gb';
import { getDoc, query, where } from 'firebase/firestore';

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

const Userform = () => {
  const [weekCommencing, setWeekCommencing] = useState(dayjs().startOf('week'));
  const [isLoading, setIsLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [technicianNameChilled, setTechnicianNameChilled] = useState('');
  const [technicianNameChemicals, setTechnicianNameChemicals] = useState('');
  const [technicianNameCooling, setTechnicianNameCooling] = useState('');
  const [coolingTechnicalName, setCoolingTechnicalName] = useState('');
  const [coolingTowerChemicalsSignature, setCoolingTowerChemicalsSignature] = useState('');
  const [chilledWaterSignature, setChilledWaterSignature] = useState('');
  const [condenserChemicalsSignature, setCondenserChemicalsSignature] = useState('');
  const [isOverlayModalOpen, setIsOverlayModalOpen] = useState(false);
  const [condenserWaterData, setCondenserWaterData] = useState([]);
  const [chilledWaterData, setChilledWaterData] = useState([]);
  const [condenserChemicalsData, setCondenserChemicalsData] = useState([]);
  const [coolingTowerChemicalsData, setCoolingTowerChemicalsData] = useState([]);
  const [notesData, setNotesData] = useState([]);
  const [additionalData, setAdditionalData] = useState([]);
  const [noteName, setNoteName] = useState('');
  const [noteSignature, setNoteSignature] = useState('');
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const [currentComponent, setCurrentComponent] = useState('');
  const sigPadRef = useRef(null);
  const [formattedWeekStart, setFormattedWeekStart] = useState(weekCommencing.format('DD-MM-YYYY'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const weekStart = weekCommencing.startOf('week').format('Do MMMM YYYY');
  const weekEnd = weekCommencing.endOf('week').format('Do MMMM YYYY');

  const handleDateChange = (date) => {
    const newWeekStart = dayjs(date).startOf('week');
    setWeekCommencing(newWeekStart);
    setFormattedWeekStart(newWeekStart.format('DD/MM/YYYY'));
  };

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
  };

  const handleOpenSignatureModal = (component) => {
    setCurrentComponent(component);
    setOpenSignatureModal(true);
  };

  const handleSign = async () => {
    const signatureDataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');

    if (currentComponent === 'chilledWater2') {
      setChilledWaterSignature(signatureDataUrl);
    } else if (currentComponent === 'condenserChemicals2') {
      setCondenserChemicalsSignature(signatureDataUrl);
    } else if (currentComponent === 'notes2') {
      setNoteSignature(signatureDataUrl);
    }

    // Save the signature to Firebase
    const docRef = doc(db, currentComponent, 'signature');
    await setDoc(docRef, { signature: signatureDataUrl });

    setOpenSignatureModal(false);
  };

  const updateData = (collectionName, data) => {
    switch (collectionName) {
      case 'condenserWater2':
        setCondenserWaterData(data);
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
      case 'notes2':
        setNotesData(data);
        break;
      case 'additionalDataTable2':
        setAdditionalData(data);
        break;
      default:
        break;
    }
  };

  const handleSaveAllData = async (params) => {
    setIsLoading(true);
  
    const plantName = "AD-008";
    try {
      // Ensure data is available before proceeding
      if (!chilledWaterData || !condenserWaterData) {
        throw new Error("Data not loaded properly.");
      }
  
      const chilledWaterDataWithId = chilledWaterData.map(item => ({
        ...item,
        id: item.id || doc(collection(db, 'chilledWater2')).id
      }));
  
      // Save technician info and signatures
      await setDoc(doc(db, 'chilledWater2', 'technicianInfo'), {
        name: technicianNameChilled,
        signature: chilledWaterSignature,
      });
  
      await setDoc(doc(db, 'condenserChemicals2', 'technicianInfo'), {
        name: technicianNameChemicals,
        signature: condenserChemicalsSignature,
      });
  
      await setDoc(doc(db, 'coolingTowerChemicals2', 'technicianInfo'), {
        name: technicianNameCooling,
        signature: coolingTowerChemicalsSignature,
      });
  
      // Save the data for each collection
      await handleSaveData('condenserWater2', condenserWaterData, condenserWaterLabels, plantName);
      await handleSaveData('chilledWater2', chilledWaterDataWithId, chilledWaterLabels, plantName);
      await handleSaveData('condenserChemicals2', condenserChemicalsData, condenserChemicalsLabels, plantName);
      await handleSaveData('coolingTowerChemicals2', coolingTowerChemicalsData, coolingTowerChemicalsLabels, plantName);
      await handleSaveData('additionalDataTable2', additionalData, additionalDataLabels, plantName);
  
      // Save notes
      await handleSaveNotes();
  
      toast.success('Report submitted successfully!');
    } catch (error) {
      console.error('Error submitting report:', error.message);  // Log the specific error message
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
      data = [data];
    }
  
    if (!rowLabels || !Array.isArray(rowLabels)) {
      console.error(`Invalid or undefined rowLabels for collection: ${collectionName}`);
      throw new Error(`Invalid or undefined rowLabels for collection: ${collectionName}`);
    }
  
    for (const row of data) {
      console.log('collectionName', collectionName);
      console.log('data', data);
      console.log('rowLabels', rowLabels);
  
      const rowDoc = doc(db, collectionName, row.id || rowLabels[data.indexOf(row)]);
      await setDoc(rowDoc, row);
    }
  };
  
  const sanitizeDocumentReference = (reference) => {
    return reference.replace(/[^a-zA-Z0-9]/g, '_');
  };

  const handleSaveNotes = async () => {
    try {
      const notesDocRef = doc(db, 'notes2', 'noteList'); // Updated to use 'notes2'

      await setDoc(notesDocRef, {
        notes: notesData,  // Ensure that the notes array is saved correctly
        name: noteName,
        signature: noteSignature
      });

    } catch (error) {
      alert("Failed to save notes. Please try again.");
    }
  };

  const handleClearAllData = async () => {
    setIsLoading(true);
    try {
      // Add the collections you want to clear
      await clearCollectionData('condenserWater2');
      await clearCollectionData('chilledWater2');
      await clearCollectionData('condenserChemicals2');
      await clearCollectionData('coolingTowerChemicals2');
      await clearCollectionData('notes2');
      await clearCollectionData('additionalDataTable2'); // Add any other collection you need to clear

      // Clear state data
      setCondenserWaterData([]);
      setChilledWaterData([]);
      setCondenserChemicalsData([]);
      setCoolingTowerChemicalsData([]);
      setNotesData([]); // Add the state for notes
      setAdditionalData([]); // Add the state for additional table data

      toast.success('Data cleared successfully!');
      window.location.reload();
    } catch (error) {
      toast.error('Error clearing data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear a specific Firestore collection
  const clearCollectionData = async (collectionName) => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error(`Error clearing data from ${collectionName}:`, error);
    }
  };

  const condenserWaterLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const chilledWaterLabels = [new Date().toLocaleDateString()];
  const condenserChemicalsLabels = [
    'PM3601 (25Kg)', 'Biocide AQ', 'PF CC6202 (20Kg)', 'PDV Salt (25Kg)', 'Sodium Hypochlorite (25 kg)',
    'BD 250C (25Kg)', 'PF CL4015 (CHW)', 'BD 350 (30Kg)', 'Dip slide (pcs)'
  ];
  const coolingTowerChemicalsLabels = [
    'Hydrochloric Acid (25Kg)', 'Sodium Hypochlorite (25Kg)', 'Phosphoric Acid (35Kg)',
    'Expired CHW Chemicals', 'Expired CT Chemicals'
  ];

  const additionalDataLabels = [
    'Condenser water dip slide test result as of: ', 'Chilled water dip slide test result as of: ',
    'Condenser system Make-up (m³ / USG)', 'Condenser system Blowdown (m³ / USG)', 'Condenser system Blowdown (m³ / USG)',
    'Chilled water system Make-up (m³ / USG)', 'C.O.C based on conductivity (Condenser/Make-up)', 'C.O.C based on (CT make-up/CT blowdown)',
    'MIOX Running Hours (Hr.)'
  ];

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsInitialLoading(true);
      try {
        // Fetch data for all components here
        const plantName = 'AD-008';

        // Fetch data for all components here, filtered by plantName
        const condenserWaterSnapshot = await getDocs(query(collection(db, 'condenserWater2'), where('plantName', '==', plantName)));
        const chilledWaterSnapshot = await getDocs(query(collection(db, 'chilledWater2'), where('plantName', '==', plantName)));
        const condenserChemicalsSnapshot = await getDocs(query(collection(db, 'condenserChemicals2'), where('plantName', '==', plantName)));
        const coolingTowerChemicalsSnapshot = await getDocs(query(collection(db, 'coolingTowerChemicals2'), where('plantName', '==', plantName)));
        const notesSnapshot = await getDocs(query(collection(db, 'notes2'), where('plantName', '==', plantName)));
        const additionalDataSnapshot = await getDocs(query(collection(db, 'additionalDataTable2'), where('plantName', '==', plantName)));

        // Process and set data accordingly
        setCondenserWaterData(condenserWaterSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setChilledWaterData(chilledWaterSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setCondenserChemicalsData(condenserChemicalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setCoolingTowerChemicalsData(coolingTowerChemicalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setNotesData(notesSnapshot.docs.map(doc => doc.data().notes).flat());
        setAdditionalData(additionalDataSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch technician info
        const chilledWaterDocRef = doc(db, 'chilledWater2', 'technicianInfo');
        const chilledWaterDocSnap = await getDoc(chilledWaterDocRef);
        if (chilledWaterDocSnap.exists()) {
          const { name, signature } = chilledWaterDocSnap.data();
          setTechnicianNameChilled(name || '');
          setChilledWaterSignature(signature || '');
        }

        const condenserChemicalsDocRef = doc(db, 'condenserChemicals2', 'technicianInfo');
        const coolingChemicalsDocRef = doc(db, 'coolingTowerChemicals2', 'technicianInfo');
        const condenserChemicalsDocSnap = await getDoc(condenserChemicalsDocRef);
        if (condenserChemicalsDocSnap.exists()) {
          const { name, signature } = condenserChemicalsDocSnap.data();
          setTechnicianNameChemicals(name || '');
          setCondenserChemicalsSignature(signature || '');
        }
        const coolingChemicalsDocSnap = await getDoc(coolingChemicalsDocRef);

        if (coolingChemicalsDocSnap.exists()) {
          const { name, signature } = condenserChemicalsDocSnap.data();
          setCoolingTechnicalName(name || '');
          setCoolingTowerChemicalsSignature(signature || '');
        }

        const notesDocRef = doc(db, 'notes2', 'technicianInfo');
        const notesDocSnap = await getDoc(notesDocRef);
        if (notesDocSnap.exists()) {
          const { name, signature } = notesDocSnap.data();
          setNoteName(name || '');
          setNoteSignature(signature || '');
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading || isInitialLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Container component={Paper} sx={{ p: 3, mt: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <img src={logo} alt="Logo" style={{ width: isMobile ? '50%' : '150px', marginBottom: '5px' }} />
          <Typography variant={isMobile ? 'h6' : 'h5'} component="h1">Water Treatment Weekly Report</Typography>
          <Grid item xs={12} sm={8} md={6}>
            <Typography variant="subtitle1" component="h2">Week Commencing Sunday: {weekStart} to {weekEnd}</Typography>
          </Grid>
          <Grid item xs={12} sm={4} md={3} marginTop={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker inputFormat="DD/MM/YYYY"
                views={['year', 'month', 'day']}
                value={weekCommencing} onChange={handleDateChange}
                label="Select Week"
                renderInput={(params) => <TextField {...params} fullWidth />} />
            </LocalizationProvider>
          </Grid>
          <Chip label="Plant Name: AD-008" color="primary" size="small" sx={{ mt: 0.5 }} />
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} sm={4}><Typography variant="subtitle2">Operations Department: TOM-OPS-FM-2009</Typography></Grid>
              <Grid item xs={12} sm={4}><Typography variant="subtitle2">Revision 03 Dated: 25/10/2021</Typography></Grid>
              <Grid item xs={12} sm={4}><Typography variant="subtitle2">Replaces Revision 02 of: 19/03/2005</Typography></Grid>
            </Grid>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'right', mb: 3, gap: 2 }}>
          <Button variant="outlined" color="error" onClick={handleClearAllData}>Clear Data</Button>
          <Button variant="contained" color="primary" onClick={handleSaveAllData}>Submit report</Button>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabIndex} onChange={handleTabChange} centered allowScrollButtonsMobile>
            <Tab label="Condenser Water" />
            <Tab label="Chilled Water" />
            <Tab label="Condenser Chemicals" />
            <Tab label="CT Cleaning Chemicals" />
            <Tab label="Notes" />
          </Tabs>
        </Box>
        <TabPanel value={tabIndex} index={0}>
          <CondenserWaterComponent
            updateData={updateData}
            handleOpenSignatureModal={handleOpenSignatureModal}
            noteSignature={chilledWaterSignature}
          />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <ChilledWaterComponent
            updateData={updateData}
            technicianName={technicianNameChilled}
            setTechnicianName={setTechnicianNameChilled}
            noteSignature={chilledWaterSignature}
            handleOpenSignatureModal={handleOpenSignatureModal}
          />
        </TabPanel>
        <TabPanel value={tabIndex} index={2}>
          <CondenserChemicalsComponent
            updateData={updateData}
            technicianName={technicianNameChemicals}
            setTechnicianName={setTechnicianNameChemicals}
            noteSignature={condenserChemicalsSignature}
            setNoteSignature={setCondenserChemicalsSignature}
            handleOpenSignatureModal={handleOpenSignatureModal}
          />
        </TabPanel>
        <TabPanel value={tabIndex} index={3}>
          <CoolingTowerChemicalsComponent
            updateData={updateData}
            onSaveAndExit={() => handleSaveAllData('exit')}
            columnLabels={[`Available empty Jerry Cans in plants (${formattedWeekStart})`]}
            handleOpenSignatureModal={handleOpenSignatureModal}
            noteSignature={coolingTowerChemicalsSignature}
            setCoolingTechnicalName={setCoolingTechnicalName}
            setTechnicianName={setTechnicianNameCooling}
            technicianName={technicianNameCooling}
            setNoteSignature={setCoolingTowerChemicalsSignature}
          />
        </TabPanel>
        <TabPanel value={tabIndex} index={4}>
          <NotesComponent
            noteSignature={noteSignature}
            setNoteSignature={setNoteSignature}
            handleSaveNotes={handleSaveNotes}
            noteName={noteName}
            setNoteName={setNoteName}
            handleOpenSignatureModal={() => handleOpenSignatureModal('notes2')}
            updateData={updateData}
          />
        </TabPanel>
      </Container>
      <Button
        variant="contained"
        color="primary"
        startIcon={<SaveIcon />}
        onClick={() => handleSaveAllData('exit')}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          borderRadius: '4px',
          padding: '8px 16px',
        }}
      >
        Save and Exit
      </Button>
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
            Your data has been successfully saved.
          </Typography>
          <Button variant="contained" color="primary" sx={{ mt: 3 }} onClick={() => setIsOverlayModalOpen(false)}>Close</Button>
        </Box>
      </Modal>

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

      <ToastContainer />
    </ThemeProvider>
  );
};

export default Userform;
