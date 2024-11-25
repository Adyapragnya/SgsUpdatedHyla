import React, { useState, useEffect, useContext } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import axios from "axios";
import ArgonBox from "components/ArgonBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MyMapComponent from "./MyMapComponent";
import { ToastContainer, toast } from 'react-toastify'; // Import Toast components
import 'react-toastify/dist/ReactToastify.css'; // Import the CSS
// import HistoryTable from "./HistoryTable";
import Vesseleighthours from './Vesseleighthours';
import Vesseltwentyfourhours from './Vesseltwentyfourhours';
import VesselSixhours from './VesselSixhours'
import ShipsinPort from './shipsinport'
import Loader from "./Loader";
import { AuthContext } from "../../AuthContext";

function Geofence() {
  const [vessels, setVessels] = useState([]);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [vesselEntries, setVesselEntries] = useState({});
  const [notifications, setNotifications] = useState([]);
  const { role, id } = useContext(AuthContext);
  const [loading, setLoading]=useState(true);


  const handleRowClick = (vessel) => {
    console.log('Row click event received with vessel:', vessel); // Log received vessel
    const selected = vessels.find(v => v.name === vessel.name);
    if (selected) {
      setSelectedVessel(selected);
      console.log("Selected vessel:", selected);
    }
  };
  


  const calculateMapCenter = () => {
    if (vessels.length === 0) return [0, 0];
    const latSum = vessels.reduce((sum, vessel) => sum + vessel.lat, 0);
    const lngSum = vessels.reduce((sum, vessel) => sum + vessel.lng, 0);
    return [latSum / vessels.length, lngSum / vessels.length];
  };

  const center = selectedVessel ? [selectedVessel.lat, selectedVessel.lng] : calculateMapCenter();
  const zoom = selectedVessel ? 10 : 6;

 
  useEffect(() => {
    const baseURL = process.env.REACT_APP_API_BASE_URL;
  
    axios.get(`${baseURL}/api/get-tracked-vessels`)
      .then((response) => {
        // Apply filtering logic based on role
        const filteredData = response.data.filter((vessel) => {
          if (role === 'hyla admin') {
            return vessel.trackingFlag;
          } else if (role === 'organization admin' || role === 'organizational user') {
            const userOrgPart = id.split('_')[1] || id;
            const vesselOrgPart = (vessel.loginUserId || '').split('_')[1] || vessel.loginUserId;
            return vessel.trackingFlag && vesselOrgPart === userOrgPart;
          } else if (role === 'guest') {
            return vessel.trackingFlag && vessel.loginUserId === id;
          }
          return false;
        });
  
        // Map filtered data to formatted data structure
        const formattedData = filteredData.map((vessel) => ({
          name: vessel.AIS.NAME || "",
          lat: Number(vessel.AIS.LATITUDE) || 0,
          lng: Number(vessel.AIS.LONGITUDE) || 0,
          heading: vessel.AIS.HEADING || 0,
          destination: vessel.AIS.DESTINATION || "",
          speed: vessel.AIS.SPEED || 0,
        }));
  
        setVessels(formattedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching vessel data:", err);
        setLoading(false);
      });
  }, [role, id]);
  
  // Log the vesselEntries whenever it changes
  useEffect(() => {
    console.log("Vessel Entries Updated:", vesselEntries);
  }, [vesselEntries]);

  // Modify handleNewGeofenceEntry to include the vessel's name and geofence details
  const handleNewGeofenceEntry = (message, vessel) => {
    setNotifications((prev) => [
      ...prev,
      {
        title: `${vessel.name} has entered ${message.title}`,
        date: new Date().toLocaleTimeString(),
        image: <img src={team2} alt="vessel" />,
      }
    ]);
  };

  // Disable keyboard shortcuts and mouse zoom
  useEffect(() => {
    const handleKeyDown = (event) => {
     
      if (event.key.startsWith('F') || (event.ctrlKey && (event.key === '+' || event.key === '-'))) {
        event.preventDefault();
        toast.warning("THIS FUNCTION IS DISABLED"); // Show toast alert
      }
    };

    const handleWheel = (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
        toast.warning("THIS FUNCTION IS DISABLED"); // Show toast alert
      }
    };

    // Add event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);
  if (loading){
    return<Loader/>;
  }

  return (
    <DashboardLayout>
      <br></br>
          {/* Marquee for 'Under Development' */}
          {/* <div style={{
        backgroundColor: '#ffcc00', 
        color: '#ffcc00', 
        fontSize: '16px', 
        fontWeight: 'bold', 
        textAlign: 'center', 
        padding: '10px', 
        marginBottom: '20px'
      }}>
        <marquee>This is UNDER DEVELOPMENT | This is UNDER DEVELOPMENT |This is UNDER DEVELOPMENT|This is UNDER DEVELOPMENT |This is UNDER DEVELOPMENT|This is UNDER DEVELOPMENT</marquee>
      </div> */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} /> {/* Toast container */}
      <DashboardNavbar vesselEntries={vesselEntries} />
      <ArgonBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <MyMapComponent
                  zoom={zoom}
                  center={center}
                  vessels={vessels}
                  selectedVessel={selectedVessel}
                  setVesselEntries={setVesselEntries}
                  onNewGeofenceEntry={handleNewGeofenceEntry}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Grid container spacing={3} mt={1}>
        <Grid item xs={12} md={12} style={{cursor:'pointer'}}>
            <h3 style={{color:'#0F67B1',marginBottom:'5px'}}>Ships In Port</h3>
              <ShipsinPort
                  vesselEntries={vesselEntries}
                  vessels={vessels}
                  onRowClick={handleRowClick}
                />
          </Grid>
        <Grid item xs={12} md={12} style={{cursor:'pointer'}}>
            <h3 style={{color:'#0F67B1',marginBottom:'5px'}}>Ships Within 6 hours</h3>
              <VesselSixhours
                  vesselEntries={vesselEntries}
                  vessels={vessels}
                  onRowClick={handleRowClick}
                />
          </Grid>
          <Grid item xs={12} md={12} style={{cursor:'pointer'}}>
            <h3 style={{color:'#0F67B1',marginBottom:'5px'}}>Ships Within 24 hours</h3>
              <Vesseleighthours
                  vesselEntries={vesselEntries}
                  vessels={vessels}
                  onRowClick={handleRowClick}
                />
          </Grid>
          <Grid item xs={12} md={12} style={{cursor:'pointer'}}>
          <h3 style={{color:'#0F67B1',marginBottom:'5px'}}>Ships beyond 24 hours </h3>
              <Vesseltwentyfourhours
              
                  vesselEntries={vesselEntries}
                  vessels={vessels}
                  onRowClick={handleRowClick}
                />
          </Grid>
        </Grid>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Geofence;
