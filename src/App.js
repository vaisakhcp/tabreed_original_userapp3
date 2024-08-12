import React, { useState } from 'react';
import {
  Container,
  AppBar,
  Tabs,
  Tab,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  createTheme,
  ThemeProvider,
} from '@mui/material';
import { blue } from '@mui/material/colors';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: blue[700],
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#5f6368',
    },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
  },
});

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

const App = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <AppBar position="static">
          <Tabs value={value} onChange={handleChange} aria-label="water treatment report tabs" centered>
            <Tab label="Condenser Water" />
            <Tab label="Chilled Water" />
            <Tab label="Stocks" />
            <Tab label="Dip Slide Tests" />
            <Tab label="CT Consumptions" />
          </Tabs>
        </AppBar>
        <TabPanel value={value} index={0}>
          <CondenserWater />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <ChilledWater />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <Stocks />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <DipSlideTests />
        </TabPanel>
        <TabPanel value={value} index={4}>
          <CTConsumptions />
        </TabPanel>
      </Container>
    </ThemeProvider>
  );
};

const CondenserWater = () => {
  const rows = [
    { day: 'Sunday', conductivity: '', pH: '', treatment: '', action: '', signature: '' },
    { day: 'Monday', conductivity: '', pH: '', treatment: '', action: '', signature: '' },
    { day: 'Tuesday', conductivity: '', pH: '', treatment: '', action: '', signature: '' },
    { day: 'Wednesday', conductivity: '', pH: '', treatment: '', action: '', signature: '' },
    { day: 'Thursday', conductivity: '', pH: '', treatment: '', action: '', signature: '' },
    { day: 'Friday', conductivity: '', pH: '', treatment: '', action: '', signature: '' },
    { day: 'Saturday', conductivity: '', pH: '', treatment: '', action: '', signature: '' },
  ];

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Day</TableCell>
            <TableCell>Conductivity</TableCell>
            <TableCell>pH</TableCell>
            <TableCell>Treatment</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Signature</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.day}>
              <TableCell>{row.day}</TableCell>
              <TableCell>{row.conductivity}</TableCell>
              <TableCell>{row.pH}</TableCell>
              <TableCell>{row.treatment}</TableCell>
              <TableCell>{row.action}</TableCell>
              <TableCell>{row.signature}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const ChilledWater = () => {
  const rows = [
    { day: 'Sunday', conductivity: '', pH: '', treatment: '', action: '', signature: '' },
    { day: 'Monday', conductivity: '', pH: '', treatment: '', action: '', signature: '' },
    { day: 'Tuesday', conductivity: '', pH: '', treatment: '', action: '', signature: '' },
    { day: 'Wednesday', conductivity: '', pH: '', treatment: '', action: '', signature: '' },
    { day: 'Thursday', conductivity: '', pH: '', treatment: '', action: '', signature: '' },
    { day: 'Friday', conductivity: '', pH: '', treatment: '', action: '', signature: '' },
    { day: 'Saturday', conductivity: '', pH: '', treatment: '', action: '', signature: '' },
  ];

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Day</TableCell>
            <TableCell>Conductivity</TableCell>
            <TableCell>pH</TableCell>
            <TableCell>Treatment</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Signature</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.day}>
              <TableCell>{row.day}</TableCell>
              <TableCell>{row.conductivity}</TableCell>
              <TableCell>{row.pH}</TableCell>
              <TableCell>{row.treatment}</TableCell>
              <TableCell>{row.action}</TableCell>
              <TableCell>{row.signature}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const Stocks = () => {
  const rows = [
    { product: 'Product A', openingStock: '', closingStock: '', consumption: '', signature: '' },
    { product: 'Product B', openingStock: '', closingStock: '', consumption: '', signature: '' },
  ];

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Product</TableCell>
            <TableCell>Opening Stock (ltr)</TableCell>
            <TableCell>Closing Stock (ltr)</TableCell>
            <TableCell>Consumption (ltr)</TableCell>
            <TableCell>Signature</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.product}>
              <TableCell>{row.product}</TableCell>
              <TableCell>{row.openingStock}</TableCell>
              <TableCell>{row.closingStock}</TableCell>
              <TableCell>{row.consumption}</TableCell>
              <TableCell>{row.signature}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const DipSlideTests = () => {
  const rows = [
    { date: '', result: '', action: '', signature: '' },
  ];

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Result</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Signature</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.date}</TableCell>
              <TableCell>{row.result}</TableCell>
              <TableCell>{row.action}</TableCell>
              <TableCell>{row.signature}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const CTConsumptions = () => {
  const rows = [
    { product: 'Product A', openingStock: '', closingStock: '', consumption: '', signature: '' },
    { product: 'Product B', openingStock: '', closingStock: '', consumption: '', signature: '' },
  ];

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Product</TableCell>
            <TableCell>Opening Stock (ltr)</TableCell>
            <TableCell>Closing Stock (ltr)</TableCell>
            <TableCell>Consumption (ltr)</TableCell>
            <TableCell>Signature</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.product}>
              <TableCell>{row.product}</TableCell>
              <TableCell>{row.openingStock}</TableCell>
              <TableCell>{row.closingStock}</TableCell>
              <TableCell>{row.consumption}</TableCell>
              <TableCell>{row.signature}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default App;
