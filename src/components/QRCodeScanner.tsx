import { DBR, ScanRegion } from 'capacitor-plugin-dynamsoft-barcode-reader';
import { useEffect, useState } from 'react';

const QRCodeScanner = (props: { isActive: boolean; 
  cameraID?: string;
  resolution?: number;
  torchOn?: boolean; 
  zoom?: number;
  scanRegion?:ScanRegion}) => {
    
  const [mounted,setMounted] = useState(false);
  useEffect(() => {
    console.log("mount scanner");
    setMounted(true);
    return ()=>{
      console.log("unmount and stop scan");
      setMounted(false);
      DBR.stopScan();
    }
  }, []);

  useEffect(() => {
    if (props.isActive) {
      DBR.startScan();
    }else{
      DBR.stopScan();
    }
  }, [props.isActive]);

  useEffect(() => {
    if (props.torchOn != undefined && mounted) {
      if (props.torchOn == true) {
        console.log("torch on");
        DBR.toggleTorch({"on":true});
      }else{
        console.log("torch off");
        DBR.toggleTorch({"on":false});
      }
    }
  }, [props.torchOn]);

  useEffect(() => {
    if (props.zoom != undefined && mounted) {
      DBR.setZoom({factor:props.zoom});
    }
  }, [props.zoom]);

  useEffect(() => {
    const selectCamera = async () => {
      if (props.cameraID != undefined && props.cameraID != "") {
        let result = await DBR.getSelectedCamera();
        if (result.selectedCamera) {
          if (result.selectedCamera == props.cameraID){
            return;
          }
        }
        DBR.selectCamera({cameraID:props.cameraID});
      }
    }
    selectCamera();
  }, [props.cameraID]);

  useEffect(() => {
    if (props.scanRegion != undefined) {
      DBR.setScanRegion(props.scanRegion);
    }
  }, [props.scanRegion]);

  useEffect(() => {
    if (props.resolution != undefined && mounted) {
      let res:number = Math.floor(props.resolution);
      DBR.setResolution({resolution:res});
    }
  }, [props.resolution]);

  return (
    <div></div>
  );

}
  
export default QRCodeScanner;