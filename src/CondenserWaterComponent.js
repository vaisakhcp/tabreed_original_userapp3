import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import TableComponent from './TableComponent';

const CondenserWaterComponent = ({ updateData }) => {
  const [condenserWaterData, setCondenserWaterData] = useState([]);
  const condenserWaterLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const condenserWaterColumns = ['Makeup Conductivity (µS/cm)', 'Condenser Conductivity (µS/cm)', 'Free Chlorine', 'Action', 'Name', 'Signature'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'condenserWater2'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCondenserWaterData(data);
      } catch (error) {
        console.error('Error fetching condenser water data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <TableComponent
      collectionName="condenserWater2"
      rowLabels={condenserWaterLabels}
      columnLabels={condenserWaterColumns}
      defaultRows={condenserWaterData}
      updateData={updateData}
    />
  );
};

export default CondenserWaterComponent;
